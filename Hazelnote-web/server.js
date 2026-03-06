const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = process.env.PORT || 3000;

// MAGIC AUTO-BUILDER (Low Resource Mode)
const nextFolder = path.join(__dirname, '.next');
if (!fs.existsSync(nextFolder)) {
    console.log("No .next folder found! Starting safe 1-thread build...");
    try {
        // Runs the Next.js compiler using the safe config we just made
        execSync('npx next build', { cwd: __dirname, stdio: 'inherit' });
        console.log("Safe build finished successfully!");
    } catch (error) {
        console.error("Auto-build failed:", error);
    }
}

const app = next({ dev, hostname, port, dir: __dirname });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});