import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: [
        'src/lib/**/*.ts',
        'src/app/api/**/*.ts',
      ],
      exclude: [
        'src/lib/supabase/**',
        'src/lib/google/**',
        'src/lib/contexts/**',
        'src/lib/db/**',
        'src/lib/pwa/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
