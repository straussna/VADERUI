VADERUI - Solute Transport UI
=============================

A React + TypeScript single-page application backed by an ASP.NET Core Web API
that uses the SoluteTransport NuGet package (https://github.com/straussna/SoluteTransport)
to run 1-D solute advection-dispersion simulations. The page plots
concentration over time at stations along the reach for one of three upstream
sources: a pulse, a constant concentration injected from t = 0 for a set
duration and then switched off; a step, a constant concentration switched on
at t = 0 and held; or a slug, a mass dumped in at t = 0. Each parameter has a slider over a typical range and
a box that accepts any typed value; the curves recompute as values change.
Grids that would take more than about two seconds to solve wait for the Run
button instead.

Measured time, concentration pairs can be pasted or loaded from a CSV file
with the distance they were taken at. Each set is drawn as markers beside the
model curve at that distance, with the root-mean-square error and the
Nash-Sutcliffe efficiency of the fit. Data sets are kept in the browser's
local storage.

The papers behind the transport model are in the SoluteTransport repository's
documentation site, docs/index.html.


Export
------

  npm run build

writes dist/VADER.html, the app as one self-contained page that opens from
disk in a desktop browser with no server or install. It runs src/solver/, a
TypeScript port of the SoluteTransport solver and of POST /api/calculate, in
a web worker; its results match the API's. The dev server (npm run dev) calls
the API instead.


Tech stack
----------

  Frontend framework   React 18 + TypeScript
  Styling              House documentation style (src/styles/style.css) with a
                       forest-river palette (src/styles/palette.css)
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
    packages/                   Bundled SoluteTransport.1.5.0.nupkg
    Models/
      SimulationRequest.cs
      BreakthroughResult.cs
    Program.cs                  POST /api/calculate

Runs the 1-D ADE simulation and returns concentrations over time at each
station. A station's values are those of the segment containing it; segment
i spans [i dx, (i + 1) dx) and its centre is (i + 0.5) * dx. Times are at
most 1001 evenly strided time levels from 0 to totalDuration.

source is "pulse", "step" or "slug". A pulse holds upstreamConcentration
(kg/m3) at the upstream boundary for time levels 0 ... n - 1, where
n = round(pulseDuration / dt), and half of it at level n, so the advective
inflow carries Q upstreamConcentration n dt; the boundary is zero after. A
step holds upstreamConcentration from t = 0. A slug sets the boundary concentration to
2 slugMass / (Q dt) at t = 0 and zero after, so the advective inflow of the
first time step carries slugMass (kg) into the reach; a slug needs Q > 0.

Request body:

  {
    "streamLength": 50.0,
    "totalDuration": 900.0,
    "dt": 0.25,
    "dx": 0.1,
    "source": "slug",
    "upstreamConcentration": 1.0,
    "pulseDuration": 300.0,
    "slugMass": 1.0,
    "stations": [12.5, 25.0, 37.5, 50.0],
    "parameters": {
      "a": 1.0,
      "aS": 0.1,
      "cL": 0.0,
      "d": 0.05,
      "q": 0.1,
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

Response:

  {
    "time": [0.0, 1.0, 2.0, "..."],
    "stations": [
      {
        "distance": 12.5,
        "segmentCentre": 12.55,
        "mainChannel": [0.0, 0.0, 0.0, "..."],
        "storageZone": [0.0, 0.0, 0.0, "..."],
        "sediment": [0.0, 0.0, 0.0, "..."]
      }
    ]
  }
