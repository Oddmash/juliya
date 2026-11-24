import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/dist/**', '**/.next/**', '**/out/**', '**/node_modules/**', '**/test-results/**', '**/playwright-report/**', '**/next-env.d.ts', 'release-artifacts/**'] },
  ...tseslint.configs.recommended,
);
