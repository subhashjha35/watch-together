import nx from '@nx/eslint-plugin';
import jsoncParser from 'jsonc-eslint-parser';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '.angular/**',
      'tmp/**',
      '.nx/**',
      '.vscode/**',
      '.idea/**',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?js$'],
          depConstraints: [
            {
              sourceTag: '*',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    // Override or add rules here
    rules: {},
  },
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        { ignoredFiles: ['{projectRoot}/eslint.config.{js,cjs,mjs}'] },
      ],
    },
    languageOptions: { parser: jsoncParser },
  },
  {
    files: ['**/src/**/*.ts'],
    languageOptions: {
      parser:
        (await import('@typescript-eslint/parser')).default ??
        (await import('@typescript-eslint/parser')),
      parserOptions: {
        project: [
          './tsconfig.base.json',
          './apps/*/tsconfig.app.json',
          './apps/*/tsconfig.json',
          './libs/*/tsconfig.lib.json',
          './libs/*/tsconfig.json',
        ],
        tsconfigRootDir: new URL('.', import.meta.url).pathname,
      },
    },
    rules: {
      '@typescript-eslint/member-ordering': [
        'error',
        {
          default: [
            // Index signatures
            'signature',
            // Static members first
            'public-static-field',
            'protected-static-field',
            'private-static-field',
            'public-static-method',
            'protected-static-method',
            'private-static-method',

            // Instance fields
            'public-instance-field',
            'protected-instance-field',
            'private-instance-field',
            // Constructors
            'public-constructor',
            'protected-constructor',
            'private-constructor',
            // Getters/Setters
            'public-instance-get',
            'protected-instance-get',
            'private-instance-get',
            'public-instance-set',
            'protected-instance-set',
            'private-instance-set',
            // Methods
            'public-instance-method',
            'protected-instance-method',
            'private-instance-method',
          ],
        },
      ],
      // TypeScript best-practices
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-expect-error': 'allow-with-description' },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/prefer-readonly': 'warn',
      '@typescript-eslint/no-misused-promises': [
        'error',
        { checksVoidReturn: { attributes: true, returns: true } },
      ],
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/prefer-nullish-coalescing': 'warn',
      '@typescript-eslint/prefer-optional-chain': 'warn',
    },
  },
  // Angular 21 best-practices for component classes
  {
    files: ['**/*.ts'],
    plugins: {
      '@angular-eslint':
        (await import('@angular-eslint/eslint-plugin')).default ??
        (await import('@angular-eslint/eslint-plugin')),
    },
    rules: {
      '@angular-eslint/prefer-on-push-component-change-detection': 'error',
      '@angular-eslint/component-class-suffix': [
        'error',
        { suffixes: ['Component'] },
      ],
      '@angular-eslint/directive-class-suffix': [
        'error',
        { suffixes: ['Directive'] },
      ],
      '@angular-eslint/no-input-rename': 'error',
      '@angular-eslint/no-output-rename': 'error',
      '@angular-eslint/component-selector': [
        'error',
        {
          type: 'element',
          style: 'kebab-case',
          // Allow any prefix to avoid forcing a specific project prefix
          prefix: [],
        },
      ],
      '@angular-eslint/directive-selector': [
        'error',
        {
          type: 'attribute',
          style: 'camelCase',
          prefix: [],
        },
      ],
    },
  },
  // Angular template accessibility & best-practices
  {
    files: ['**/*.html'],
    plugins: {
      '@angular-eslint/template':
        (await import('@angular-eslint/eslint-plugin-template')).default ??
        (await import('@angular-eslint/eslint-plugin-template')),
    },
    rules: {
      '@angular-eslint/template/eqeqeq': 'error',
      '@angular-eslint/template/no-negated-async': 'warn',
      '@angular-eslint/template/banana-in-box': 'error',
      '@angular-eslint/template/no-call-expression': 'warn',
      '@angular-eslint/template/cyclomatic-complexity': [
        'warn',
        { maxComplexity: 6 },
      ],
    },
  },
];
