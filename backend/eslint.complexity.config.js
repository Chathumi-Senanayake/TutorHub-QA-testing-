// Used only to EXTRACT real cyclomatic-complexity numbers per function for the
// White-Box Testing report (Lesson 4) - "max: 1" forces every function to be
// reported, because ESLint's complexity rule only prints a function's actual
// number when it exceeds the max. This is not the project's normal lint config.
export default [
  {
    files: ['src/controllers/**/*.js', 'src/middleware/**/*.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'module' },
    rules: {
      complexity: ['warn', { max: 1 }],
    },
  },
];
