import { defineConfig } from 'tsup';

// ADR: Workspace packages ship TypeScript source, so the production build bundles them
// (`noExternal`) while leaving real npm dependencies external for the Docker image.
export default defineConfig({
  entry: { main: 'src/main.ts', seed: 'prisma/seed.ts' },
  format: ['esm'],
  platform: 'node',
  target: 'node20',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  noExternal: [/^@ogfn\//],
});
