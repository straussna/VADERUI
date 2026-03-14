# VADERUI — Solute Transport UI

A React + TypeScript single-page application that provides a user interface for the [SoluteTransport API](https://github.com/straussna/SoluteTransport). Users can configure all solute transport simulation parameters and view the resulting concentration profiles in an interactive graph.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Charting | Plotly.js via react-plotly.js |
| Forms | React Hook Form |
| HTTP client | Axios |

---

## Prerequisites

- **Node.js 18+** (includes npm)

---

## Setup

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Configure the API base URL
#    Copy and edit the environment file
cp .env.example .env
# Set VITE_API_BASE_URL to point to your running SoluteTransport API

# 3. Start the development server
npm run dev
```

The app will be available at **http://localhost:5173**.

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000/api` | Base URL of the SoluteTransport backend API |

Create a `.env` file in the project root to override:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

---

## Project Structure

```
src/
├── api/
│   └── soluteTransport.ts   # Axios API client
├── components/
│   ├── InputForm/            # Parameter input form (react-hook-form)
│   ├── ResultsChart/         # Plotly concentration profile chart
│   └── Layout/               # App shell with header
├── types/
│   └── index.ts              # TypeScript interfaces
├── App.tsx                   # Root component
└── main.tsx                  # Entry point
```
