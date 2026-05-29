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
        protocol: "https",
        hostname: "avatars.githubusercontent.com", // For GitHub profile pictures
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // For Google profile pictures
      },
    ],
  },
};

export default nextConfig;