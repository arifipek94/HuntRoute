#!/usr/bin/env node

/**
 * Smart Development Environment Setup Script
 * This script initializes an intelligent development environment for Globe Fare
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function runCommand(command, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stderr });
      } else {
        resolve(stdout);
      }
    });
  });
}

async function checkDependencies() {
  log('\n🔍 Checking development dependencies...', 'blue');

  const requiredTools = [
    { name: 'Node.js', command: 'node --version' },
    { name: 'npm', command: 'npm --version' },
    { name: 'TypeScript', command: 'npx tsc --version' },
    { name: 'ESLint', command: 'npx eslint --version' },
    { name: 'Prettier', command: 'npx prettier --version' },
  ];

  for (const tool of requiredTools) {
    try {
      const version = await runCommand(tool.command);
      log(`✅ ${tool.name}: ${version.trim()}`, 'green');
    } catch (error) {
      log(`❌ ${tool.name}: Not found or error`, 'red');
    }
  }
}

async function validateEnvironment() {
  log('\n🔧 Validating development environment...', 'blue');

  const frontendPath = path.join(__dirname, '../');
  const backendPath = path.join(__dirname, '../../globe-fare-adaptive');

  // Check if package.json exists
  if (fs.existsSync(path.join(frontendPath, 'package.json'))) {
    log('✅ Frontend package.json found', 'green');
  } else {
    log('❌ Frontend package.json not found', 'red');
  }

  if (fs.existsSync(path.join(backendPath, 'package.json'))) {
    log('✅ Backend package.json found', 'green');
  } else {
    log('❌ Backend package.json not found', 'red');
  }

  // Check VS Code settings
  const vscodeSettings = path.join(__dirname, '../../.vscode/settings.json');
  if (fs.existsSync(vscodeSettings)) {
    log('✅ VS Code settings configured', 'green');
  } else {
    log('⚠️  VS Code settings not found', 'yellow');
  }
}

async function setupIntelligentWorkspace() {
  log('\n🚀 Setting up intelligent development workspace...', 'cyan');

  try {
    // Install frontend dependencies
    log('📦 Installing frontend dependencies...', 'blue');
    await runCommand('npm install', path.join(__dirname, '../'));
    log('✅ Frontend dependencies installed', 'green');

    // Install backend dependencies
    log('📦 Installing backend dependencies...', 'blue');
    await runCommand(
      'npm install',
      path.join(__dirname, '../../globe-fare-adaptive')
    );
    log('✅ Backend dependencies installed', 'green');

    // Run type check
    log('🔍 Running TypeScript validation...', 'blue');
    await runCommand('npx tsc --noEmit', path.join(__dirname, '../'));
    log('✅ TypeScript validation passed', 'green');

    // Run linting
    log('🔍 Running ESLint validation...', 'blue');
    await runCommand(
      'npx eslint src/**/*.{ts,tsx,js,jsx} --format pretty',
      path.join(__dirname, '../')
    );
    log('✅ ESLint validation passed', 'green');
  } catch (error) {
    log(`❌ Setup failed: ${error.stderr || error.error?.message}`, 'red');
    process.exit(1);
  }
}

async function main() {
  log('🌟 Globe Fare - Intelligent Development Environment Setup', 'cyan');
  log('=========================================================', 'cyan');

  await checkDependencies();
  await validateEnvironment();
  await setupIntelligentWorkspace();

  log('\n🎉 Intelligent development environment is ready!', 'green');
  log('\n💡 Available commands:', 'blue');
  log('   npm run smart:dev    - Start with validation', 'cyan');
  log('   npm run smart:fix    - Auto-fix code issues', 'cyan');
  log('   npm run smart:validate - Full validation', 'cyan');
  log('\n📝 VS Code Tasks:', 'blue');
  log('   Smart Dev: Full Stack - Launch both frontend & backend', 'cyan');
  log('   Smart Code Quality Check - Comprehensive validation', 'cyan');
  log('   Smart Auto Fix - Automatic code formatting', 'cyan');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, checkDependencies, validateEnvironment };
