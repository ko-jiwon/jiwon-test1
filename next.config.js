/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['news.google.com'],
  },
  eslint: {
    // 빌드 시 ESLint 에러가 있어도 무시하고 배포 진행
    ignoreDuringBuilds: true,
  },
  typescript: {
    // 타입 에러가 있어도 무시하고 배포 진행
    ignoreBuildErrors: true,
  },
}

module.exports = nextConfig
