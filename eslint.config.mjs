import tseslint from 'typescript-eslint';
import globals from 'globals';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist/**', 'html/phantasma.js', '**/*.d.ts'],
  },

  ...tseslint.configs.recommended,

  prettier,

  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
        project: false,
      },
      globals: {
        ...globals.es2020,
        ...globals.node,
        ...globals.browser,
      },
    },
    rules: {
      'no-var': 'error',
    },
  },

  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
  },
];
