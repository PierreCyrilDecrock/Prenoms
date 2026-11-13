import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist',
      'node_modules',
      'public/data',
      'test-results',
      'playwright-report',
      '.lighthouse',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    // Règle d'or : le cœur ne dépend d'aucun module précis ni de l'interface.
    files: ['src/core/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@/sources/*',
                '@/derived/*',
                '@/filters/*',
                '@/sorts/*',
                '@/ui/*',
                '@/state/*',
              ],
              message:
                'src/core ne dépend jamais d’une source, d’un filtre, d’un tri ou de l’interface.',
            },
          ],
        },
      ],
    },
  },
  prettier,
);
