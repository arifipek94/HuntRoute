<div align="center">
  <h1>HuntRoute - Flight Search Application</h1>
  <p>
    A modern flight search application that helps users find the cheapest flights to their desired destinations with real-time pricing and multiple data sources.
  </p>
  <!-- Optional: Add badges here (e.g., build status, license, version) -->
  <!--
    <a href="https://github.com/yourusername/huntroute/actions"><img src="https://github.com/yourusername/huntroute/actions/workflows/main.yml/badge.svg" alt="Build Status"></a>
    <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
    <a href="https://www.npmjs.com/package/your-package-name"><img src="https://img.shields.io/npm/v/your-package-name.svg" alt="NPM Version"></a>
  -->
</div>

---

## 🚀 Features

- **Reverse Flight Search**: Enter a destination and find the cheapest routes from anywhere
- **Real-time Flight Data**: Live pricing from multiple sources
- **Smart Caching**: Optimized performance with intelligent cache management
- **Modern UI**: Minimal display animation and responsive design
- **Multiple Destinations**: Support for popular worldwide destinations
- **Date Flexibility**: Quick date selection or custom date picker
- **Homepage Button**: Always-visible homepage button at the top right
- **Consistent UI**: Search bar and input heights aligned across all components
- **Alt Info Placement**: Destination code/country info now directly below the input
- **Container Tweaks**: Fine-tuned paddings and heights for pixel-perfect alignment

## 🏗️ Architecture

### Frontend (`huntroute-frontend/`)

- **Framework**: Next.js 14 with TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React Query (TanStack Query)
- **Components**: Modern React with hooks
- **Data Fetching**: Custom service layer with caching
- **Image Optimization**: Next.js remotePatterns for airline logos (Kiwi.com)
- **UI Consistency**: Search bar height and container spacing precisely controlled

### Backend (`huntroute-adaptive/`)

- **Runtime**: Node.js
- **Framework**: Express.js
- **Caching**: File-based caching with 12-hour expiry
- **Data Sources**: Amadeus API integration
- **Utilities**: Flight data processing and formatting

## 📁 Project Structure

<!--
  Provide a brief overview of the main directories and their purpose.
  Example:
  huntroute/
  ├── huntroute-frontend/      # Next.js frontend application
  │   ├── src/
  │   ├── public/
  │   └── ...
  ├── huntroute-adaptive/      # Node.js/Express.js backend API
  │   ├── src/
  │   └── ...
  └── README.md
-->

````
(Provide a tree structure of your project here if desired, or a brief explanation)

## 🛠️ Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v18.x or later recommended)
- npm (v9.x or later) or yarn (v1.22.x or later)
- Git

### Installation

1.  **Clone the repository (if applicable, or describe setup for separate repos):**
    ```bash
    git clone https://github.com/yourusername/huntroute.git
    cd huntroute
    ```

2.  **Install Frontend Dependencies:**
    ```bash
    cd huntroute-frontend
    npm install
    # or
    # yarn install
    ```

3.  **Install Backend Dependencies:**
    ```bash
    cd ../huntroute-adaptive
    npm install
    # or
    # yarn install
    ```

## 💻 Usage

### Running the Frontend

From the `huntroute-frontend` directory:
```bash
npm run dev
# or
# yarn dev
````

The application will be available at `http://localhost:3000`.

### Running the Backend

From the `huntroute-adaptive` directory:

```bash
npm run start # Or your specific command to start the backend server
# or
# yarn start
```

The backend API will typically be available at `http://localhost:PORT` (e.g., `http://localhost:3001` or `http://localhost:8000` - specify your backend port).

## 🔑 Environment Variables

Both frontend and backend applications may require environment variables.

**Frontend (`huntroute-frontend/`):**
Create a `.env.local` file in the `huntroute-frontend` directory:

```env
# Example:
# NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
# Add other frontend-specific environment variables here
```

**Backend (`huntroute-adaptive/`):**
Create a `.env` file in the `huntroute-adaptive` directory:

```env
# Example:
# PORT=8000
# AMADEUS_CLIENT_ID=your_amadeus_client_id
# AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
# Add other backend-specific environment variables here
```

Refer to `.env.example` files in each project (if you create them) for a full list of required variables.

## 🚀 Deployment

(Instructions on how to deploy the application. Mention platforms like Vercel for Next.js, and Heroku/AWS/DigitalOcean for the backend, or your specific deployment strategy.)

Example:

- **Frontend**: Can be deployed to Vercel, Netlify, or any static hosting provider that supports Next.js.
- **Backend**: Can be deployed to platforms like Heroku, AWS Elastic Beanstalk, DigitalOcean App Platform, or a traditional VPS.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature-name`).
3. Make your changes.
4. Commit your changes (`git commit -m 'Add some feature'`).
5. Push to the branch (`git push origin feature/your-feature-name`).
6. Open a Pull Request.

Please make sure to update tests as appropriate.

## 📜 License

This project is licensed under the GNU Affero General Public License v3.0 - see the [LICENSE](LICENSE) file for details (you'll need to create this file).

## 🙏 Acknowledgements

- Hat tip to anyone whose code was used.
- Inspiration
- etc.

---

<p align="center">Happy Route Hunting!</p>
