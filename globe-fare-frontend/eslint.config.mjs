import { FlatCompat } from '@eslint/eslintrc';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends(
    'next/core-web-vitals',
    'next/typescript',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:prettier/recommended'
  ),
  {
    rules: {
      'prettier/prettier': ['error', { semi: true, singleQuote: true }],
      'react/react-in-jsx-scope': 'off',
      // Allow inline styles for dynamic styling
      'react/forbid-component-props': 'off',
      'react/forbid-dom-props': 'off',
      // Less strict ARIA rules for dynamic components
      'jsx-a11y/aria-props': 'warn',
      'jsx-a11y/aria-proptypes': 'off',
      'jsx-a11y/aria-expanded': 'off',
      // Disable all ARIA validation for dynamic React components
      'jsx-a11y/aria-role': 'off',
      'jsx-a11y/no-aria-hidden-on-focusable': 'off',
      // Temporarily disable TypeScript strict rules for deployment
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      '@next/next/no-page-custom-font': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];

export default eslintConfig;
