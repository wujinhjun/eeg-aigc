import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import viteEslint from 'vite-plugin-eslint';
import svgr from 'vite-plugin-svgr';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), viteEslint(), svgr()],
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src')
    }
  }
});
