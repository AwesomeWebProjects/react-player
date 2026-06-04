import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const isLibBuild = mode === 'lib';

  return {
    plugins: [
      react(),
      ...(isLibBuild
        ? [
            dts({
              include: ['src'],
              outDir: 'dist',
              rollupTypes: true,
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
    build: isLibBuild
      ? {
          lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            name: 'ReactPlayer',
            formats: ['es', 'cjs'],
            fileName: (format) =>
              `react-player.${format === 'es' ? 'js' : 'cjs'}`,
          },
          rollupOptions: {
            external: ['react', 'react-dom', 'react/jsx-runtime'],
            output: {
              globals: {
                react: 'React',
                'react-dom': 'ReactDOM',
                'react/jsx-runtime': 'jsxRuntime',
              },
            },
          },
          cssCodeSplit: false,
        }
      : {
          outDir: 'dist-demo',
        },
  };
});
