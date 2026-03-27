import { build } from 'esbuild'
import { builtinModules } from 'node:module'

await build({
  entryPoints: ['src/index.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: 'dist/index.js',
  external: [
    ...builtinModules,
    ...builtinModules.map((m) => `node:${m}`),
    '@prisma/client',
    '@prisma/adapter-libsql',
    '@libsql/client',
    'dotenv',
    'cheerio',
  ],
})
