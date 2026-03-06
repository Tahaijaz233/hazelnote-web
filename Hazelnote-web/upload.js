const fs = require('fs');

async function uploadFile() {
  try {
    console.log("📦 Reading your compiled Next.js app...");
    const fileData = fs.readFileSync('next_build.tar.gz');
    
    // Convert to a format the internet understands
    const blob = new Blob([fileData]);
    const formData = new FormData();
    formData.append('file', blob, 'next_build.tar.gz');

    console.log("🚀 Uploading to secure temporary server... Please wait.");
    
    // Upload using Node's built-in fetch
    const response = await fetch('https://file.io', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();
    
    if (data.success) {
      console.log("\n✅ SUCCESS! Copy the link below and paste it into your Windows browser:");
      console.log("👉👉  " + data.link + "  👈👈\n");
      console.log("(Note: This link only works ONCE. If you click it, the file deletes itself for security).");
    } else {
      console.log("Upload failed:", data.message);
    }
  } catch (err) {
    console.error("❌ Error uploading:", err.message);
  }
}

uploadFile();