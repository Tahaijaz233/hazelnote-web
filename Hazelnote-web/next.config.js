/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // CRITICAL: Disables the Rust compiler that spawned too many threads
  swcMinify: false, 
  experimental: {
    // CRITICAL: Forces Next.js to only use 1 thread to respect shared hosting limits
    cpus: 1,
    workerThreads: false,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

module.exports = nextConfig;