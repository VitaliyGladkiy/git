export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
    },
    rules: {
      complexity: ['warn', 5],
      'no-unused-vars': 'warn',
      'camelcase': 'error',
    },
  },
];
