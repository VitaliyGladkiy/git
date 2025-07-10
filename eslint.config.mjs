export default [
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'commonjs',
    },
    rules: {
      complexity: ['warn', 5],
      camelcase: 'error',
      'no-unused-vars': 'warn'
    }
  }
];

