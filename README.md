# EMR Frontend

Enterprise EMR Appointment Management System — Frontend Application

## Tech Stack

- **Framework**: React 18 + Vite 5
- **Language**: TypeScript 5 (strict)
- **Routing**: React Router v6
- **Server State**: TanStack Query v5
- **HTTP Client**: Axios
- **Forms**: React Hook Form + Zod
- **Testing**: Vitest + Testing Library

## Prerequisites

- Node.js v22+
- npm 11+

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env

# 3. Start development server
npm run dev
```

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server (http://localhost:5173) |
| `npm run build` | TypeScript check + Vite production build |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |
| `npm run lint:fix` | Auto-fix lint errors |
| `npm run typecheck` | TypeScript type checking (no emit) |
| `npm test` | Run all Vitest tests |
| `npm run test:watch` | Run Vitest in watch mode |

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `VITE_API_BASE_URL` | No | `http://localhost:5000/api/v1` | Backend API base URL |

## Architecture

```
src/
  api/            → Axios instance + typed API functions (no direct fetch in components)
  components/
    ui/           → Reusable primitives: Button, Card, Badge, Spinner
    layout/       → AppShell, Sidebar, Header
  constants/      → Route path constants
  features/       → Feature-sliced modules (Phase 1+)
  hooks/          → TanStack Query hooks
  pages/          → Page-level components
  router/         → React Router v6 configuration
  styles/         → Global CSS + design tokens
  types/          → Shared TypeScript types
  utils/          → Shared utilities
  App.tsx         → Root component (QueryClientProvider + RouterProvider)
  main.tsx        → React DOM mount
```

## Design System

| Token | Value | Usage |
|---|---|---|
| `--color-bg-primary` | `#ffffff` | Page backgrounds |
| `--color-bg-secondary` | `#f8f9fa` | Muted sections |
| `--color-text-primary` | `#0a0a0a` | Body text |
| `--color-text-secondary` | `#6c757d` | Muted text |
| `--color-border` | `#dee2e6` | Borders, dividers |
| `--color-accent` | `#0a0a0a` | Primary actions |

## Git Workflow

- `main` → untouched production branch
- `dev` → integration branch
- `chore/*`, `feat/*`, `fix/*` → feature branches from `dev`

Never merge directly into `main` during development.
