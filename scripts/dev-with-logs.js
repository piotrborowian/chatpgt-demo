#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create log file with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const logFile = path.join(logsDir, `dev-${timestamp}.log`);
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

console.log(`🚀 Starting development server...`);
console.log(`📝 Logs will be saved to: ${logFile}`);
console.log(`📂 You can also download frontend logs using the debug panel in the app`);
console.log(`───────────────────────────────────────────────────────────────────────`);

// Spawn the development server
const child = spawn('npm', ['run', 'dev'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
});

// Function to write to both console and file
function logOutput(data, prefix = '') {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] ${prefix}${data}`;
  
  // Write to console (preserve original behavior)
  process.stdout.write(data);
  
  // Write to log file
  logStream.write(message);
}

function logError(data) {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] [ERROR] ${data}`;
  
  // Write to console (preserve original behavior)
  process.stderr.write(data);
  
  // Write to log file
  logStream.write(message);
}

// Handle stdout
child.stdout.on('data', (data) => {
  logOutput(data);
});

// Handle stderr
child.stderr.on('data', (data) => {
  logError(data);
});

// Handle process exit
child.on('close', (code) => {
  const timestamp = new Date().toISOString();
  const message = `[${timestamp}] [PROCESS] Development server exited with code ${code}\n`;
  
  console.log(`\n📝 Development server exited with code ${code}`);
  console.log(`📁 Full logs saved to: ${logFile}`);
  
  logStream.write(message);
  logStream.end();
  
  process.exit(code);
});

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n⏹️  Stopping development server...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  child.kill('SIGTERM');
}); 