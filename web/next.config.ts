import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // Matches all paths on the domain
        source: '/:path*',
        
        // Only triggers if the request host exactly matches the 'www' version
        has: [
          {
            type: 'host',
            value: 'www.antiqueoven.mogitechglobal.com',
          },
        ],
        
        // Forces the redirect to the base domain while preserving the URL path
        destination: 'https://antiqueoven.mogitechglobal.com/:path*',
        
        // Uses a 301 Permanent Redirect (good for SEO and caching)
        permanent: true,
      },
    ];
  },
};

export default nextConfig;