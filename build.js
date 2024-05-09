const { build } = require('esbuild')
const { dependencies, peerDependencies } = require('./package.json')
const { Generator } = require('npm-dts');

const entry = 'src/index.ts'

void new Generator({
  entry,
  output: 'dist/index.d.ts',
}).generate();

// @see https://janessagarrow.com/blog/typescript-and-esbuild/
const sharedConfig = {
  entryPoints: [entry],
  platform: 'node',
  bundle: true,
  minify: true,
  external: Object
    .keys(dependencies || {})
    .concat(Object.keys(peerDependencies | {})),
}

void build({
  ...sharedConfig,
  outfile: 'dist/index.js',
})

void build({
  ...sharedConfig,
  outfile: 'dist/index.esm.js',
  format: 'esm',
})
