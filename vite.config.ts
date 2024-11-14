import { resolve } from 'node:path';
import { defineConfig, UserConfig } from 'vite';

export default defineConfig(({ mode }) => {
  const baseConfig: UserConfig = {
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      }
    },
    build: {
      minify: mode === 'production' ? 'esbuild' : false,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            if (id.includes('node_modules')) return 'vendor';
          },
        },
      },
    },
  };

  return baseConfig;
});
