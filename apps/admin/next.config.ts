import type { NextConfig } from 'next'
import { config as loadEnv } from 'dotenv'
import { resolve } from 'path'

loadEnv({ path: resolve(process.cwd(), '../../.env') })

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.API_URL || 'https://api.zaidp101.tech'}/api/:path*`
      },
    ]
  },
}

export default nextConfig
