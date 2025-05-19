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
}

module.exports = nextConfig
