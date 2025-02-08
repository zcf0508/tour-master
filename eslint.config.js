// @ts-check
import antfu from '@antfu/eslint-config';

export default antfu(
  {
    type: 'lib',
  },
  [
    {
      rules: {
        'curly': ['error', 'all'],
        'style/brace-style': 'error',
        'style/multiline-ternary': ['error', 'always'],
        'unused-imports/no-unused-imports': 'off',
        'unused-imports/no-unused-vars': [
          'warn',
          { args: 'after-used', argsIgnorePattern: '^_', vars: 'all', varsIgnorePattern: '^_' },
        ],
        'no-console': ['warn'],
        'style/semi': ['error', 'always'],
        'style/indent': ['error', 2, { SwitchCase: 1 }],
        'style/max-len': [
          'error',
          {
            code: 120,
            tabWidth: 2,
            ignoreRegExpLiterals: true,
            ignoreComments: true,
            ignoreStrings: true,
            ignoreUrls: true,
          },
        ],
        'style/comma-dangle': ['error', 'always-multiline'],
        'style/quotes': ['error', 'single'],
        '@typescript-eslint/no-explicit-any': ['error', {
          fixToUnknown: true,
          ignoreRestArgs: true,
        }],
      },
    },
  ],
);
