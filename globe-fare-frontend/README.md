<div align="center">
  <h1>Globe Fare - Flight Search Application</h1>
  <p>
    A modern flight search application that helps users find the cheapest flights to their desired destinations with real-time pricing and intelligent caching.
  </p>
  <p><b>Demo Notice:</b> Currently, only Bali and Bangkok are available as destinations. We are waiting for unlimited API access; once obtained, the full version will support all destinations worldwide.</p>
</div>

## Features

- Reverse Flight Search: Enter a destination and find the cheapest routes from anywhere
- Real-time Flight Data: Live pricing from multiple data sources
- Smart Caching: Optimized performance with intelligent cache management
- Interactive 3D Globe: Engaging destination visualization
- Modern UI: Responsive design with smooth animations
- Flexible Date Selection: Quick date options and custom date picker

## Architecture

### Frontend

- Framework: Next.js 15 with TypeScript
- Styling: Tailwind CSS v4
- State Management: TanStack React Query
- UI Components: Headless UI, Lucide React
- Animations: Framer Motion
- 3D Graphics: React Three Fiber

### Backend

- Runtime: Node.js with Express.js
- Caching: File-based caching with 12-hour expiry
- Data Sources: Amadeus API integration

## Project Structure

globe-fare/
├── globe-fare-frontend/ # Next.js frontend application
│ ├── src/
│ │ ├── app/ # Next.js app router
│ │ ├── components/ # React components
│ │ ├── hooks/ # Custom React hooks
│ │ ├── lib/ # Utility libraries
│ │ └── types/ # TypeScript type definitions
│ ├── public/ # Static assets
│ └── ...
└── globe-fare-adaptive/ # Node.js backend API
├── api/ # API endpoints
├── cache/ # Flight data cache
├── data/ # Static data files
└── ...

## Getting Started

### Prerequisites

- Node.js (v18.x or later)
- npm (v9.x or later)
- Git

### Installation

1. Clone the repository:
   git clone <your-repository-url>
   cd globe-fare
2. Install Frontend Dependencies:
   cd globe-fare-frontend
   npm install
3. Install Backend Dependencies:
   cd ../globe-fare-adaptive
   npm install

### Environment Setup

Frontend (.env.local):
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api

Backend (.env):
PORT=8000
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret

## Usage

### Development

Start the Backend:
cd globe-fare-adaptive
npm start

Start the Frontend:
cd globe-fare-frontend
npm run dev

The application will be available at http://localhost:3000

### Production Build

cd globe-fare-frontend
npm run build
npm start

## Deployment

- Frontend: Deploy to Vercel, Netlify, or any static hosting provider that supports Next.js
- Backend: Deploy to Heroku, AWS, DigitalOcean, or any Node.js hosting platform

## License

This project is licensed under the MIT License.

---

<p align="center">Happy Route Hunting! ✈️</p>
