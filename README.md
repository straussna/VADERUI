# VADERUI — Solute Transport UI

A React + TypeScript single-page application backed by an ASP.NET Core Web API that uses the [SoluteTransport](https://github.com/straussna/SoluteTransport) NuGet package to run 1-D solute advection-dispersion simulations. Users configure stream parameters and view interactive concentration profiles for the main channel, transient-storage zone, and sediment.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend framework | React 18 + TypeScript |
| Build tool | Vite |
| Charting | Plotly.js via react-plotly.js |
| Forms | React Hook Form |
| HTTP client | Axios |
| Backend framework | ASP.NET Core 8 Minimal API |
| Simulation engine | [SoluteTransport](https://github.com/straussna/SoluteTransport) NuGet package |

---

## Prerequisites

- **Node.js 18+** (includes npm)
- **.NET 8 SDK**

---

## Project Structure

```
├── api/                         # ASP.NET Core backend
│   ├── VADERUI.Api.csproj
│   ├── nuget.config             # Includes GitHub Packages + local fallback
│   ├── packages/                # Bundled SoluteTransport.1.0.0.nupkg
│   ├── Models/
│   │   ├── SimulationRequest.cs
│   │   └── SimulationSnapshot.cs
│   └── Program.cs               # POST /api/calculate endpoint
└── src/                         # React + TypeScript frontend
    ├── api/soluteTransport.ts   # Axios client
    ├── components/
    │   ├── InputForm/            # Stream parameters form
    │   ├── ResultsChart/         # Plotly concentration profile chart
    │   └── Layout/               # App shell with header
    ├── types/index.ts            # TypeScript interfaces
    ├── App.tsx                   # Root component
    └── main.tsx                  # Entry point
```

---

## Setup & Running

### 1. Start the backend API

```bash
cd api
dotnet run
# API available at http://localhost:5000
```

> **Note:** The `SoluteTransport` NuGet package is sourced from the bundled
> `api/packages/SoluteTransport.1.0.0.nupkg` file.  If you have a GitHub
> Personal Access Token with `read:packages` scope you can also pull directly
> from GitHub Packages by setting `GITHUB_TOKEN` in your environment.

### 2. Start the frontend

```bash
# From the repository root
npm install
npm run dev
# App available at http://localhost:5173
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:5000/api` | Base URL of the VADERUI backend API |

Create a `.env` file in the project root to override:

```env
VITE_API_BASE_URL=http://localhost:5000/api
```

---

## Available Scripts

### Frontend

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

### Backend

| Command | Description |
|---|---|
| `dotnet run` | Start development API server |
| `dotnet build` | Build the project |
| `dotnet publish` | Publish for production |

---

## API

### `POST /api/calculate`

Runs the 1-D ADE simulation and returns concentration profiles at evenly-spaced time snapshots.

**Request body:**
```json
{
  "streamLength": 50.0,
  "totalDuration": 3600.0,
  "dt": 1.0,
  "dx": 0.5,
  "upstreamConcentration": 1.0,
  "upstreamDuration": 600.0,
  "outputTimeSteps": 10,
  "parameters": {
    "a": 1.0,
    "aS": 0.1,
    "cL": 0.0,
    "d": 0.05,
    "q": 0.5,
    "qLin": 0.0,
    "alpha": 0.001,
    "chatS": 0.0,
    "kd": 0.0,
    "lambda": 0.0,
    "lambdaS": 0.0,
    "lambdaHat": 0.0,
    "lambdaHatS": 0.0,
    "rho": 0.0
  }
}
```

**Response:** Array of snapshots, one per output time step:
```json
[
  {
    "time": 360.0,
    "distance": [0.5, 1.0, 1.5, "..."],
    "mainChannel": [0.0, 0.12, 0.35, "..."],
    "storageZone": [0.0, 0.08, 0.22, "..."],
    "sediment": [0.0, 0.0, 0.0, "..."]
  }
]
```

