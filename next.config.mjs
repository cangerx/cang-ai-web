/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // 代理 API 请求到 Laravel 后端
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/:path*`,
      },
      {
        source: '/storage/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/storage/:path*`,
      },
      {
        source: '/images/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/images/:path*`,
      },
    ]
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.dmiapi.com' },
      { protocol: 'https', hostname: '**.duomiapi.com' },
    ],
  },
}

export default nextConfig
