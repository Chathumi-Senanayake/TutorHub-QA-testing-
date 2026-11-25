import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['tests/unit/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary', 'lcov'],
      reportsDirectory: './tests/coverage',
      include: [
        'src/controllers/**',
        'src/middleware/**',
        'src/utils/**',
      ],
    },
  },
});
