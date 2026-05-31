/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
  
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // This wildcard allows images from Google, future upload hosts (like S3/Vercel Blob), and email avatars.
      },
    ],
    dangerouslyAllowSVG: true, // Helpful if default avatars are generated as SVGs
  },
};

export default nextConfig;