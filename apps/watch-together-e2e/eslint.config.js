import cypress from 'eslint-plugin-cypress/flat';
import baseConfig from '../../eslint.config.js';

export default [
  cypress.configs['recommended'],
  ...baseConfig,
  {
    // Override or add rules here
    rules: {},
  },
];
