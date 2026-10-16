import base from './packages/config/eslint.base.mjs';

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/out/**',
      '**/release/**',
      '**/coverage/**',
      'apps/backend/prisma/migrations/**',
    ],
  },
  ...base,
];
