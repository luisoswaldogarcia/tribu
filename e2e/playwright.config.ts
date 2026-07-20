import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from '@playwright/test'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

export default defineConfig({
  testDir: '.',
  timeout: 10000,
  retries: 0,
  use: {
    baseURL: 'http://127.0.0.1:5191',
    headless: true,
  },
  webServer: {
    command: 'npx vite --host 127.0.0.1 --port 5191',
    cwd: projectRoot,
    port: 5191,
    reuseExistingServer: false,
  },
})
