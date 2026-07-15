// Dev launcher: clears ELECTRON_RUN_AS_NODE before starting Vite
delete process.env.ELECTRON_RUN_AS_NODE;
const { spawn } = require('child_process');
const vite = spawn('npx', ['vite'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});
vite.on('exit', (code) => process.exit(code));
