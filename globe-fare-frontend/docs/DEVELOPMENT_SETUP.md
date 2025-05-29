# Development Setup Guide

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 18.0.0 or higher
- **npm**: Version 8.0.0 or higher
- **Git**: Latest version
- **VS Code**: Recommended IDE

### Initial Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd globe-fare

# Setup frontend
cd globe-fare-frontend
npm install
cp .env.example .env.local

# Setup backend
cd ../globe-fare-adaptive
npm install
cp .env.example .env

# Start development servers
# Terminal 1 (Backend)
cd globe-fare-adaptive
npm start

# Terminal 2 (Frontend)
cd globe-fare-frontend
npm run dev
```

## 🔧 Development Tools

### VS Code Extensions

Install these recommended extensions:

```json
{
  "recommendations": [
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "formulahendry.auto-rename-tag",
    "christian-kohler.path-intellisense",
    "ms-vscode.vscode-json"
  ]
}
```

### VS Code Settings

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"]
  ]
}
```

## 📁 Project Organization

### Frontend Structure
