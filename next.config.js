/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['undici', 'cheerio'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't include undici on the client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        undici: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
