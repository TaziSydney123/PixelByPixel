# PixelByPixel

A collaborative pixel art app where two users take turns placing one pixel at a time on a shared 10x10 canvas — like a slow, creative conversation told in color.

## What It Is

PixelByPixel is a turn-based, pixel-art messaging platform. Instead of sending text messages, users communicate by collaboratively building pixel art — one pixel per turn. Each pair of users shares a persistent canvas they paint together over time, then can export and share the finished piece.

## How It Works

1. **Sign up or log in** with a username and password
2. **Find a collaborator** by searching for other users
3. **Take turns placing pixels** — pick a pixel on the 10x10 grid, choose from 20 colors, and send
4. **Wait for your partner** to make their move (you'll see a "Your Turn!" indicator when it's your go)
5. **Share the result** — export the finished canvas as a PNG using your device's native share sheet

The home screen shows all your active canvases and whether it's your turn or your partner's.

## Tech Stack

**Frontend** (this repo)
- React 18 + TypeScript
- Vite (with PWA support — installable as a standalone app)
- Ant Design for UI components
- React Router for navigation

**Backend** (separate repo)
- REST API over HTTPS
- JWT-based authentication
- Stores canvas state as a 2D color grid per user pair

## Project Structure

```
src/
├── pages/
│   ├── login/        # Auth screen (login + signup)
│   ├── home/         # Contact list with turn status
│   └── canvas/       # The collaborative pixel canvas
├── components/
│   ├── Canvas.tsx    # 10x10 pixel grid with color picker
│   └── FindUsers.tsx # Search modal for finding collaborators
├── network.ts        # API client
└── types/User.ts     # Shared type definitions
```

## Getting Started

```bash
npm install
npm run dev
```

The app will start at `http://localhost:5173`. It expects a backend API to be running — see `src/network.ts` for the base URL configuration.

**Other commands:**
```bash
npm run build    # Production build
npm run preview  # Preview the production build
npm run lint     # Run ESLint
```

## API Endpoints

The frontend communicates with a backend via POST requests to these endpoints:

| Endpoint           | Description                              |
|--------------------|------------------------------------------|
| `login`            | Authenticate and receive a JWT token     |
| `contacts`         | List all users you're collaborating with |
| `similarUsernames` | Search for users by username             |
| `getCanvas`        | Fetch the current canvas state           |
| `pixel`            | Submit your pixel placement              |

Canvas state is returned as a 10x10 2D array of hex color strings, along with whose turn it is (`WAITING_SELF` or `WAITING_CONTACT`).

## Features

- **Turn-based collaboration** — only the active player can send a pixel
- **20-color palette** — a curated set of colors for painting
- **Live status polling** — home screen refreshes every second to show whose turn it is
- **Export & share** — renders the canvas to a PNG and triggers the native share dialog
- **PWA support** — installable on mobile as a standalone app with offline capability
- **Responsive canvas** — scales to fit any screen size
