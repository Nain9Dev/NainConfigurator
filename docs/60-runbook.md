# Operational Runbook — NainConfigurator

## 1. Port Reservations

Configured in `eng/local-development.json` and `web/vite.config.ts`:

| Service | Port | Protocol | Description |
| :--- | :--- | :--- | :--- |
| **Web Dev Server** | `5180` | HTTP | React 19 + TypeScript (`strictPort: true`) |
| **Web Preview** | `5181` | HTTP | Production build preview |
| **Public API Host** | `5187` | HTTP | ASP.NET Core Minimal API |

## 2. Local Execution

### Backend Architecture & Domain Tests

```powershell
# Run Clean Architecture fitness functions
dotnet test backend/tests/NainConfigurator.Architecture.Tests/NainConfigurator.Architecture.Tests.csproj

# Run Domain catalog evaluation tests
dotnet test backend/tests/NainConfigurator.Domain.Tests/NainConfigurator.Domain.Tests.csproj
```

### Frontend Client (React 19)

```powershell
cd web

# Install dependencies
npm ci

# Run unit tests
npm test

# Run production build (generates offline catalog & bundles visual packs)
npm run build

# Start dev server on port 5180
npm run dev
```

The client application runs cleanly against the bundled offline catalog (`public/offline-catalog.json`), supporting live option customization and real-time visual pack updates without requiring an external database connection.
