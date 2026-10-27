VADERUI - Solute Transport UI
=============================

A React + TypeScript single-page application backed by an ASP.NET Core Web API
that uses the SoluteTransport NuGet package (https://github.com/straussna/SoluteTransport)
to run 1-D solute advection-dispersion simulations. Each parameter has a
slider over a typical range and a box that accepts any typed value; the
concentration profiles for the main channel, transient-storage zone and
sediment recompute as values change. Grids above 2e8 segment-steps wait for
the Run button instead of recomputing on every change.

The papers behind the transport model are in the SoluteTransport repository's
documentation site, docs/index.html.


Tech stack
----------

  Frontend framework   React 18 + TypeScript
  Styling              House documentation style (public/style.css) with a
                       forest-river palette (public/palette.css)
  Build tool           Vite
  Charting             Plotly.js via react-plotly.js
  HTTP client          Axios
  Backend framework    ASP.NET Core 10 Minimal API
  Simulation engine    SoluteTransport NuGet package


Prerequisites
-------------

  - Node.js 18+ (includes npm)
  - .NET 10 SDK


Project structure
-----------------

  api/                          ASP.NET Core backend
    VADERUI.Api.csproj
    nuget.config                Includes GitHub Packages + local fallback
    packages/                   Bundled SoluteTransport.1.4.0.nupkg
    Models/
      SimulationRequest.cs
      SimulationSnapshot.cs
    Program.cs                  POST /api/calculate endpoint
  public/
    style.css                   House stylesheet
    palette.css                 Forest-river colour tokens
  src/                          React + TypeScript frontend
    api/soluteTransport.ts      Axios client and API error messages
    components/
      ParameterControl.tsx      Slider with a typed-value box
      ResultsChart/             Plotly concentration profile chart
    types/index.ts              TypeScript interfaces
    controls.ts                 Defaults, slider ranges and scales
    useSimulation.ts            Live recomputation, one request in flight
    App.tsx                     Page layout
    main.tsx                    Entry point


Setup and running
-----------------

1. Start the backend API (http://localhost:5000):

     cd api
     dotnet run

   The SoluteTransport NuGet package is sourced from the bundled
   api/packages/SoluteTransport.1.4.0.nupkg file. With a GitHub Personal Access
   Token that has read:packages scope, it can also be pulled from GitHub
   Packages by setting GITHUB_TOKEN in the environment.

2. Start the frontend (http://localhost:5173), from the repository root:

     npm install
     npm run dev


Environment variables
---------------------

  VITE_API_BASE_URL   default http://localhost:5000/api
                      Base URL of the VADERUI backend API

Create a .env file in the project root to override:

  VITE_API_BASE_URL=http://localhost:5000/api


Available scripts
-----------------

Frontend:

  npm run dev        Start development server
  npm run build      Type-check and build for production
  npm run preview    Preview the production build locally
  npm run lint       Run ESLint

Backend:

  dotnet run         Start development API server
  dotnet build       Build the project
  dotnet publish     Publish for production


API
---

POST /api/calculate

Runs the 1-D ADE simulation and returns concentration profiles at
evenly-spaced time snapshots, the last at totalDuration. Distances are
segment centres, (i + 0.5) * dx from the upstream boundary.

Request body:

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
      "rho": 0.0,
      "qLout": 0.0
    }
  }

Response: an array of snapshots, one per output time step:

  [
    {
      "time": 360.0,
      "distance": [0.25, 0.75, 1.25, "..."],
      "mainChannel": [0.0, 0.12, 0.35, "..."],
      "storageZone": [0.0, 0.08, 0.22, "..."],
      "sediment": [0.0, 0.0, 0.0, "..."]
    }
  ]
