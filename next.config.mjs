/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/onboarding',
        destination: '/dashboard/setup',
        permanent: false,
      },
    ]
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
