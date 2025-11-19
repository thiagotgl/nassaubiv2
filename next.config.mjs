/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://136.112.228.146:3000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
