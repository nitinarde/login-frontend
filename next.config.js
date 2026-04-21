/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/login",
        destination: "/login",
      },
    ];
  },
};

module.exports = nextConfig;
