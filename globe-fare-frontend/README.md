<div align="center">
  <h1>🌍 Hunt Route - Smart Flight Search</h1>
  <p>
    A modern flight search application that helps users find the cheapest flights with intelligent reverse search and real-time pricing.
  </p>
  <p><b>Live Demo:</b> <a href="https://huntroute.vercel.app">huntroute.vercel.app</a></p>
</div>

## ✨ Features

- **🔄 Reverse Flight Search**: Enter a destination and find the cheapest routes from anywhere
- **💰 Real-time Pricing**: Live flight data with intelligent caching
- **🌐 Interactive 3D Globe**: Engaging destination visualization
- **📱 Responsive Design**: Modern UI that works on all devices
- **⚡ Smart Caching**: Optimized performance with 12-hour cache expiry
- **📅 Flexible Dates**: Quick date selection and custom date picker

## 🏗️ Architecture

### Frontend
- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: TanStack React Query
- **UI Components**: Headless UI, Lucide React
- **Animations**: Framer Motion
- **3D Graphics**: React Three Fiber

### Backend
- **Runtime**: Node.js with Express.js
- **Caching**: File-based caching system
- **Data Sources**: Amadeus API integration

## 📁 Project Structure

```
hunt-route/
├── globe-fare-frontend/          # Next.js frontend application
│   ├── src/
│   │   ├── app/                  # Next.js app router
│   │   │   ├── api/              # API routes
│   │   │   │   ├── flights/      # Flight search endpoints
│   │   │   │   └── debug/        # Debug utilities
│   │   │   └── results/          # Results pages
│   │   ├── components/           # React components
│   │   │   ├── search/           # Search-related components
│   │   │   └── ui/               # Reusable UI components
│   │   ├── hooks/                # Custom React hooks
│   │   ├── lib/                  # Utility libraries
│   │   └── types/                # TypeScript definitions
│   └── public/                   # Static assets & data
└── globe-fare-adaptive/          # Node.js backend API
    ├── api/                      # API endpoints
    ├── cache/                    # Flight data cache
    ├── data/                     # Static data files
    └── services/                 # Business logic
```
## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18.x or later recommended)
- **npm** (v9.x or later) or **yarn** (v1.22.x or later)
- **Git**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/arifipek94/HuntRoute.git
   cd HuntRoute
   ```

2. **Install Frontend Dependencies:**
   ```bash
   cd globe-fare-frontend
   npm install
   ```

3. **Install Backend Dependencies:**
   ```bash
   cd ../globe-fare-adaptive
   npm install
   ```

### Environment Setup

**Frontend (.env.local):**
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

**Backend (.env):**
```env
PORT=8000
AMADEUS_CLIENT_ID=your_amadeus_client_id
AMADEUS_CLIENT_SECRET=your_amadeus_client_secret
```

## 💻 Usage

### Development Mode

1. **Start the Backend Server:**
   ```bash
   cd globe-fare-adaptive
   npm start
   ```
   Backend will run on `http://localhost:8000`

2. **Start the Frontend Development Server:**
   ```bash
   cd globe-fare-frontend
   npm run dev
   ```
   Frontend will be available at `http://localhost:3000`

### Production Build

```bash
cd globe-fare-frontend
npm run build
npm start
```

## 🚀 Deployment

- **Frontend**: Deployed on Vercel at [huntroute.vercel.app](https://huntroute.vercel.app)
- **Backend**: Deploy to Heroku, Railway, or any Node.js hosting platform

## 🛠️ Development

### Available Scripts

**Frontend:**
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

**Backend:**
- `npm start` - Start the API server
- `npm run dev` - Start with nodemon (if configured)

## 📝 License

This project is licensed under the MIT License.

---

<p align="center">
  <b>Happy Route Hunting! ✈️🌍</b><br>
  <i>Find your next adventure at the best price</i>
</p>
