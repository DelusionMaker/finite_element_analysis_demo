import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// 把 @fem/core 直接解析到内核源码（Vite 用 esbuild 实时转译 TS），
// 免去内核预打包，开发与内核联动最顺。内核零 UI 依赖，可随时迁出。
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@fem/core': r('../packages/core/src/index.ts'),
    },
  },
  optimizeDeps: {
    exclude: ['@fem/core'],
  },
  server: {
    port: 5173,
    host: true,
  },
});
