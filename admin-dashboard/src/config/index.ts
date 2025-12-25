// Environment configuration with validation
export const config = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1',
    timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 30000,
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Volcanion Tracking Admin',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  },
  features: {
    enableAuth: process.env.NEXT_PUBLIC_ENABLE_AUTH === 'true',
    enableMockData: process.env.NEXT_PUBLIC_ENABLE_MOCK_DATA === 'true',
  },
} as const;

// Validate required config
if (!config.api.baseUrl) {
  throw new Error('NEXT_PUBLIC_API_BASE_URL is required');
}

export default config;
