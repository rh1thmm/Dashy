import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createDashyApiHandler } from './bin/api.js'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'dashy-api',
      configureServer(server) {
        const dashyApi = createDashyApiHandler()
        server.middlewares.use(async (req, res, next) => {
          if (await dashyApi(req, res)) return
          next()
        })
      },
    },
  ],
  server: {
    port: 4200,
  },
})
