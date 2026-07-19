import { defineConfig } from '@playwright/test'
import path from 'path'

export default defineConfig({
  testDir: '.',
  timeout: 10000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: {
    command: 'npx vite',
    port: 5173,
    reuseExistingServer: true,
  },
})
