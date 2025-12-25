import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  
  // Experimental features
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },

  // Environment variables validation
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
  },
};

export default nextConfig;
