import { resolve } from 'node:path';
import { defineConfig, UserConfig } from 'vite';
import { chunkSplitPlugin } from 'vite-plugin-chunk-split';

export default defineConfig(({ mode }) => {
  const baseConfig: UserConfig = {
    plugins: [
      chunkSplitPlugin({
        strategy: 'default',
      }),
    ],
    server: {
      host: '0.0.0.0',
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
      }
    },
    build: {
      minify: mode === 'production' ? 'esbuild' : false,
    },
  };

  return baseConfig;
});
