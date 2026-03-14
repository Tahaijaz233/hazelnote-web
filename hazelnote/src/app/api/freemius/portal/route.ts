import { NextResponse } from 'next/response';
import crypto from 'crypto';
import { adminDb, adminAuth } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    // 1. Verify the user is logged into HazelNote
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    // 2. Look up the user's Freemius User ID in Firebase
    const userDoc = await adminDb.collection('profiles').doc(uid).get();
    const fsUserId = userDoc.data()?.fs_user_id;

    if (!fsUserId) {
      return NextResponse.json({ error: 'No Freemius User ID found. User may not have an active subscription.' }, { status: 400 });
    }

    // 3. Prepare the Freemius API Request
    const pluginId = process.env.NEXT_PUBLIC_FREEMIUS_PRODUCT_ID;
    const publicKey = process.env.NEXT_PUBLIC_FREEMIUS_PUBLIC_KEY;
    const secretKey = process.env.FREEMIUS_SECRET_KEY;

    if (!pluginId || !publicKey || !secretKey) {
      throw new Error("Missing Freemius API keys");
    }

    const method = 'GET';
    const resourceUrl = `/v1/plugins/${pluginId}/users/${fsUserId}/login.json`;
    const date = new Date().toUTCString(); // Freemius requires an exact Date header match

    // 4. Generate the required HMAC SHA256 Signature
    const stringToSign = [method, resourceUrl, date].join('\n');
    const signature = crypto.createHmac('sha256', secretKey).update(stringToSign).digest('base64');
    const fsAuthHeader = `FS ${pluginId}:${publicKey}:${signature}`;

    // 5. Fetch the Magic Link from Freemius
    const freemiusRes = await fetch(`https://api.freemius.com${resourceUrl}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Date': date,
        'Authorization': fsAuthHeader
      }
    });

    const freemiusData = await freemiusRes.json();

    if (!freemiusRes.ok) {
      console.error("Freemius API Error:", freemiusData);
      return NextResponse.json({ error: 'Failed to generate login URL' }, { status: 500 });
    }

    // 6. Send the generated magic link back to the frontend
    return NextResponse.json({ url: freemiusData.login_url });

  } catch (error: any) {
    console.error('Portal generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
