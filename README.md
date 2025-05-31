# HuntRoute - Flight Search Application

A modern flight search application that helps users find the cheapest flights to their desired destinations with real-time pricing and multiple data sources.

## 🚀 Features

- **Reverse Flight Search**: Enter a destination and find the cheapest routes from anywhere
- **Real-time Flight Data**: Live pricing from multiple sources
- **Smart Caching**: Optimized performance with intelligent cache management
- **Modern UI**: Split-flap display animation and responsive design
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
