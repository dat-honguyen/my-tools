import * as fs from 'node:fs';
import * as http from 'node:http';
import * as path from 'node:path';
import * as esbuild from 'esbuild';
import { runEsBuildBuilder } from '@softarc/native-federation-esbuild';

const workspaceRoot = path.join(__dirname, '..');
const outputPath = 'dist/devkit';
const isServe = process.argv.includes('--serve');
const port = 4201;

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.css': 'text/css',
};

function serveDist() {
  const distDir = path.join(workspaceRoot, outputPath);
  const server = http.createServer((req, res) => {
    const reqPath = (req.url ?? '/').split('?')[0];
    const filePath = path.join(distDir, decodeURIComponent(reqPath === '/' ? '/index.html' : reqPath));
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }
      res.setHeader('Content-Type', CONTENT_TYPES[path.extname(filePath)] ?? 'application/octet-stream');
      res.end(data);
    });
  });
  server.listen(port, () => {
    console.log(`DevKit dev server running at http://localhost:${port}`);
  });
}

async function run() {
  // Work around a bug in @softarc/native-federation's cache-persistence
  // copyFiles(): it does `mkdirSync(path.dirname(fullOutputPath))` instead of
  // `mkdirSync(fullOutputPath)`, so on a brand-new dist/ the shared-bundle
  // subdirectory never gets created before the copy, and copyFileSync throws
  // ENOENT. Pre-creating it here makes that mkdirSync a no-op.
  fs.mkdirSync(path.join(workspaceRoot, outputPath), { recursive: true });

  await runEsBuildBuilder('federation.config.js', {
    workspaceRoot,
    outputPath,
    tsConfig: 'tsconfig.json',
    entryPoints: ['src/main.ts'],
    watch: isServe,
    dev: isServe,
    cacheExternalArtifacts: false,
    adapterConfig: {
      plugins: [],
      loader: { '.css': 'text' },
      // The adapter defaults to a React framework plugin that hardcodes
      // React <=18's `*.production.min.js` CJS filenames; React 19.2 renamed
      // those to `*.production.js` (no `.min`), so the default plugin fails
      // to resolve them. React's own `index.js` already branches on
      // `NODE_ENV` correctly, so no framework-specific file replacement is
      // needed here.
      frameworks: [],
    },
  });

  // native-federation's `entryPoints` option only feeds its "used shared
  // deps" analysis (see normalize-options.js) — it does not emit a bundle.
  // index.html's <script src="./main.js"> needs an actual standalone bundle
  // of the host entry point, built separately here.
  await esbuild.build({
    entryPoints: [path.join(workspaceRoot, 'src/main.ts')],
    outfile: path.join(workspaceRoot, outputPath, 'main.js'),
    bundle: true,
    platform: 'browser',
    format: 'esm',
    sourcemap: isServe,
    minify: !isServe,
    loader: { '.css': 'text' },
    define: { 'process.env.NODE_ENV': isServe ? '"development"' : '"production"' },
  });

  fs.copyFileSync(path.join(workspaceRoot, 'index.html'), path.join(workspaceRoot, outputPath, 'index.html'));

  if (isServe) {
    serveDist();
  } else {
    console.log('DevKit build complete.');
    // runEsBuildBuilder's non-watch path leaves esbuild's service process
    // running, which would otherwise keep this script alive indefinitely.
    process.exit(0);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
