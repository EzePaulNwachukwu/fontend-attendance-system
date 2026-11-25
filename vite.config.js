// vite.config.js
// Vite settings. We add two plugins:
// - react():       lets Vite understand JSX and React fast refresh
// - tailwindcss(): the official Tailwind CSS v4 plugin for Vite

import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
})
