# VADERUI

React + TypeScript frontend (Vite, repository root) and ASP.NET Core API (`api/`). See
`README.md` for the stack, structure and HTTP API.

## Runtime

- Node 24 and npm from PATH for the frontend. npm is the package manager
  (`package-lock.json`); there is no yarn or pnpm.
- .NET SDK 10.0.401 for the API (`net10.0`). `SoluteTransport` restores from the bundled
  `api/packages/SoluteTransport.1.0.0.nupkg` through `api/nuget.config`.
- There is no test suite.

In the Bash tool, prefix each command with `cd /c/source/repos/VADERUI &&`
(from a worktree, its own path).

Commands run from the repository root and are identical in the Bash tool and PowerShell:

| Task | Command |
|---|---|
| Install frontend deps | `npm install` |
| Lint | `npm run lint` |
| Type-check and build frontend | `npm run build` |
| Frontend dev server (http://localhost:5173) | `npm run dev` |
| Restore / build API | `dotnet restore api/VADERUI.Api.csproj`, `dotnet build api/VADERUI.Api.csproj` |
| Run API (http://localhost:5000) | `dotnet run --project api/VADERUI.Api.csproj` |

Tool versions resolve from `node_modules`: `npx --no-install eslint --version`,
`npx --no-install tsc --version`, `npx --no-install vite --version`.
