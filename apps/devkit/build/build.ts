import * as esbuild from 'esbuild';
import * as path from 'path';
import * as fs from 'fs';
import { createEsBuildAdapter } from '@softarc/native-federation-esbuild';
import { federationBuilder } from '@softarc/native-federation';

async function main() {
  const serve = process.argv.includes('--serve');
  const outputPath = 'dist/devkit';

  await federationBuilder.init({
    options: {
      workspaceRoot: path.join(__dirname, '..'),
      outputPath,
      tsConfig: 'tsconfig.json',
      federationConfig: 'federation.config.js',
      verbose: false,
    },
    adapter: createEsBuildAdapter({ plugins: [] }),
  });

  fs.rmSync(outputPath, { force: true, recursive: true });

  const buildOptions: esbuild.BuildOptions = {
    entryPoints: ['src/main.ts'],
    external: federationBuilder.externals,
    outdir: outputPath,
    bundle: true,
    platform: 'browser',
    format: 'esm',
    mainFields: ['es2020', 'browser', 'module', 'main'],
    conditions: ['es2020', 'es2015', 'module'],
    resolveExtensions: ['.tsx', '.ts', '.mjs', '.js'],
    tsconfig: 'tsconfig.json',
    splitting: true,
    sourcemap: true,
    loader: { '.css': 'css' },
  };

  if (serve) {
    const ctx = await esbuild.context(buildOptions);
    await ctx.watch();
    const { host, port } = await ctx.serve({ servedir: outputPath, port: 4202 });
    console.log(`devkit serving at http://${host}:${port}/remoteEntry.json`);
  } else {
    await esbuild.build(buildOptions);
  }

  fs.copyFileSync('index.html', path.join(outputPath, 'index.html'));

  await federationBuilder.build();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
