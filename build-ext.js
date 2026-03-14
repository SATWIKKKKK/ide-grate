const { execSync } = require('child_process');
const path = require('path');

const extDir = path.join(__dirname, 'vscode-extension');

try {
  console.log('=== Compiling TypeScript ===');
  execSync('npx tsc -p .', { cwd: extDir, stdio: 'inherit', shell: true });
  console.log('TypeScript compiled successfully.');

  console.log('\n=== Packaging VSIX ===');
  execSync('npx @vscode/vsce package --no-dependencies', { cwd: extDir, stdio: 'inherit', shell: true });
  console.log('VSIX packaged successfully.');
} catch (err) {
  console.error('Build failed:', err.message);
  process.exit(1);
}
