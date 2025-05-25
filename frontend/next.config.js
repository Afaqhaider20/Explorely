/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'images.unsplash.com',
      'localhost',
      'res.cloudinary.com',
      'cloudinary.com',
      'avatars.githubusercontent.com',
      'i.pravatar.cc'  // Added this domain for avatar images
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:5000/api/:path*', // Proxy to backend
      },
    ];
  },
}

module.exports = nextConfig
