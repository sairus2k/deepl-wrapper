import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		tailwindcss(),
		react({
			babel: {
				plugins: [['babel-plugin-react-compiler']],
			},
		}),
	],
	server: {
		host: true,
		allowedHosts: true,
		// Note: API routes are handled by Cloudflare Pages Functions
		// For local dev, use `pnpm pages:dev` instead of `pnpm dev`
		// Or keep the old API server running with `pnpm dev:api`
		proxy: {
			'/api': {
				target: 'http://localhost:3001',
				changeOrigin: true,
				rewrite: (path) => path.replace(/^\/api/, ''),
			},
		},
	},
})
