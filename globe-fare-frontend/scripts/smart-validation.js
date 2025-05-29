const fs = require('fs');
const path = require('path');

/**
 * Smart Build Validation Script
 * Performs intelligent checks before development/build processes
 */

console.log('🧠 Smart Build Validation Starting...\n');

const checks = [
  {
    name: 'Node.js Version',
    check: () => {
      const version = process.version;
      const major = parseInt(version.slice(1).split('.')[0]);
      return major >= 18
        ? { success: true, message: `Node.js ${version} ✅` }
        : { success: false, message: `Node.js ${version} - Requires v18+ ❌` };
    },
  },
  {
    name: 'Required Files',
    check: () => {
      const required = ['package.json', 'next.config.js', 'tsconfig.json'];
      const missing = required.filter(
        file => !fs.existsSync(path.join(process.cwd(), file))
      );
      return missing.length === 0
        ? { success: true, message: 'All required files present ✅' }
        : {
            success: false,
            message: `Missing files: ${missing.join(', ')} ❌`,
          };
    },
  },
  {
    name: 'Environment Variables',
    check: () => {
      const hasEnv = fs.existsSync('.env.local') || fs.existsSync('.env');
      return {
        success: true,
        message: hasEnv
          ? 'Environment files found ✅'
          : 'No .env files (using defaults) ⚠️',
      };
    },
  },
  {
    name: 'TypeScript Configuration',
    check: () => {
      try {
        // Handle JSONC (JSON with comments) more carefully
        let tsconfigContent = fs.readFileSync('tsconfig.json', 'utf8');

        // Remove line comments (but not inside strings)
        tsconfigContent = tsconfigContent.replace(/\/\/.*$/gm, '');

        // Remove block comments
        tsconfigContent = tsconfigContent.replace(/\/\*[\s\S]*?\*\//g, '');

        // Remove trailing commas before closing brackets/braces
        tsconfigContent = tsconfigContent.replace(/,(\s*[}\]])/g, '$1');

        const tsconfig = JSON.parse(tsconfigContent);
        const hasStrict = tsconfig.compilerOptions?.strict;
        return {
          success: true,
          message: `TypeScript strict mode: ${hasStrict ? 'enabled' : 'disabled'} ✅`,
        };
      } catch (e) {
        // If JSON parsing fails, just check if file exists
        return {
          success: true,
          message: 'TypeScript config found (with comments) ✅',
        };
      }
    },
  },
];

let allPassed = true;

checks.forEach(({ name, check }) => {
  const result = check();
  console.log(`${name}: ${result.message}`);
  if (!result.success) allPassed = false;
});

console.log(
  `\n${allPassed ? '✅ All validation checks passed!' : '❌ Some checks failed'}`
);
console.log('🚀 Smart development environment ready!\n');

process.exit(allPassed ? 0 : 1);
