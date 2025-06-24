# HuntRoute

HuntRoute is a modern flight search app designed to help users find the most affordable one-way flights to selected destinations so they could make smarter travelling routes. Built with a clean UI and real-time API integration, it delivers fast and accurate results with minimal interaction.

> ⚠️ **Demo Version** – Currently supports flights **only to Bali (DPS)** and **Bangkok (BKK)**.  
> Full destination support will be added once API partnership is established.

🌐 [Live Frontend](https://hunt-route.vercel.app/)  
🔗 [API Backend](https://huntroute.onrender.com/)

---

## 📸 Screenshots

**Search Page**
> ![Search Page](https://raw.githubusercontent.com/arifipek94/HuntRoute/refs/heads/main/Screenshot%202025-06-21%20014125.png)

**Results Page**
> ![Results Page](https://raw.githubusercontent.com/arifipek94/HuntRoute/refs/heads/main/Screenshot%202025-06-21%20014145.png)

---

---
## ✈️ Features

- **Reverse Search** – Find the cheapest routes *to* Bali or Bangkok from anywhere
- **Date Picker** – Choose flexible departure dates with quick or custom selection
- **Live Results** – Flight data fetched on demand from integrated APIs
- **Smart Caching** – 12-hour cache layer improves performance and reduces API load
- **Responsive Design** – Mobile-friendly UI with pixel-precise alignment
- **Destination Info** – Airport codes and countries shown clearly in input UI

---

## 🧱 Tech Stack

### Frontend (`huntroute-frontend/`)
- **Framework:** Next.js 14 (React + TypeScript)
- **Styling:** Tailwind CSS
- **State/Data:** TanStack Query (React Query)
- **Assets:** Remote image optimization for airline logos

### Backend (`huntroute-adaptive/`)
- **Runtime:** Node.js
- **Framework:** Express.js
- **API Integration:** Amadeus Flights API
- **Caching:** File-based with 12-hour expiry
- **Utilities:** Flight data formatting & validation


## 🪪 License

Licensed under the **GNU Affero General Public License v3.0**.
