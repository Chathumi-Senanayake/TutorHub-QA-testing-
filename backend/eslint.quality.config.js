// A lightweight static-analysis pass over the REAL backend code, standing in
// for a SonarQube scan (no SonarQube server is available in this environment -
// see Testing/Member-5/Quality-Metrics/README.md for what to run for real).
import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { process: 'readonly', console: 'readonly', Buffer: 'readonly', __dirname: 'readonly' },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-undef': 'error',
      eqeqeq: 'warn',
      'no-implicit-coercion': 'warn',
    },
  },
];
