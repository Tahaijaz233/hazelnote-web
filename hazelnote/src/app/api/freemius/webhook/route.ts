import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, limit, updateDoc } from 'firebase/firestore';

// Helper to verify Freemius webhook signature
function verifyFreemiusSignature(signature: string, body: string, secretKey: string) {
  const hash = crypto.createHmac('sha256', secretKey).update(body).digest('hex');
  return hash === signature;
}

export async function POST(req: Request) {
  try {
    const bodyText = await req.text();
    const signature = req.headers.get('x-freemius-signature');
    const secretKey = process.env.FREEMIUS_SECRET_KEY;

    if (!secretKey) {
      console.error('Freemius Secret Key is missing in environment variables.');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    if (!signature || !verifyFreemiusSignature(signature, bodyText, secretKey)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(bodyText);
    const eventType = payload.type; 
    const data = payload.data;
    
    // Freemius often nests the user data, we optionally chain to fail safely
    const userEmail = data?.user?.email || data?.customer?.email;

    if (!userEmail) {
      return NextResponse.json({ error: 'No user email found in payload' }, { status: 400 });
    }

    // Find the user in Firebase by email to update their profile
    const profilesRef = collection(db, 'profiles');
    const q = query(profilesRef, where('email', '==', userEmail), limit(1));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.warn(`Webhook received for ${userEmail}, but no matching Firebase user found.`);
      return NextResponse.json({ success: true, message: 'User not found, ignored.' });
    }

    const userDoc = snapshot.docs[0];
    const userRef = userDoc.ref;

    // Handle correct Freemius events
    switch (eventType) {
      case 'subscription.created':
        // User just bought the plan
        await updateDoc(userRef, {
          is_pro: true,
          fs_plan_type: data.billing_cycle === 1 ? 'monthly' : 'annual',
          fs_subscription_id: data.id,
          fs_user_id: data.user_id,
          fs_renewal_date: data.next_payment || null,
          fs_is_cancelled: false,
        });
        break;

      case 'payment.created':
        // User's subscription renewed successfully or initial payment processed
        await updateDoc(userRef, {
          is_pro: true,
          fs_user_id: data.user_id || data.user?.id || null,
          fs_plan_type: data.billing_cycle === 1 ? 'monthly' : 'annual',
          fs_renewal_date: data.next_payment || null,
          fs_is_cancelled: false,
        });
        break;

      case 'license.activated':
        // License activated after purchase
        await updateDoc(userRef, {
          is_pro: true,
          fs_user_id: data.user_id || data.user?.id || null,
          fs_is_cancelled: false,
        });
        break;

      case 'subscription.cancelled':
        // User cancelled auto-renew, but they still have access until the period ends.
        // We just flag it so the UI knows not to show "Renews on", but rather "Expires on"
        await updateDoc(userRef, {
          fs_is_cancelled: true,
        });
        break;

      case 'license.expired':
        // The billing period ended after a cancellation, or their card failed too many times.
        // THIS is when we actually revoke Pro access.
        await updateDoc(userRef, {
          is_pro: false,
          fs_plan_type: null,
          fs_renewal_date: null,
          fs_is_cancelled: false,
        });
        break;

      default:
        console.log(`Unhandled Freemius event: ${eventType}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
