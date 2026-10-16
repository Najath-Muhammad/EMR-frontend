# EMR Frontend Application

Enterprise Electronic Medical Record (EMR) Appointment Management System — modern, accessible, single-page application built with React 18, TypeScript, Vite, and TanStack Query.

---

## 1. Project Overview

The EMR Frontend provides clinical staff with an intuitive, real-time interface tailored to their specific roles:
- **Super Admin**: Hospital-wide setup, departments CRUD, doctor and receptionist user creation with activation links, weekly doctor schedule configuration (sessions and breaks), and an immutable real-time audit trail.
- **Receptionist**: Fast patient search and registration with duplicate pre-screening, dynamic multi-session doctor slot picker with instant booking, appointment status lifecycle management (`SCHEDULED` ➔ `CONFIRMED` ➔ `ARRIVED` ➔ `COMPLETED` / `CANCELLED`), and reschedule history.
- **Doctor**: Privacy-isolated clinical queue displaying only the doctor's assigned appointments, patient demographic summary, status indicators, and consultation notes recording.

---

## 2. Features & Role Navigation

| Route | View Description | Allowed Roles |
|---|---|---|
| `/login` | Email and password authentication with password toggle | All / Public |
| `/activate` | Account activation and password creation via secure token | Invited Staff |
| `/dashboard` | Clinical overview, daily schedule summary, quick actions | Super Admin, Doctor, Receptionist |
| `/departments` | Manage hospital departments and view staffing | Super Admin, Receptionist (Read) |
| `/users` | Staff directory: create doctors and receptionists | Super Admin |
| `/schedules` | Configure weekly doctor templates, sessions, and breaks | Super Admin |
| `/patients` | Patient directory, search, registration, and duplicate warning | Super Admin, Receptionist |
| `/appointments` | Booking wizard, slot picker, queue management | Super Admin, Receptionist |
| `/doctor/queue` | Doctor's private patient queue and consultation notes | Doctor |
| `/audit` | Real-time audit log stream and investigative filters | Super Admin |

---

## 3. Technology Stack

- **Framework**: React 18.3
- **Build Tool**: Vite 5.3
- **Language**: TypeScript 5.5 (strict mode enabled)
- **Routing**: React Router v6.24 (declarative routes with `ProtectedRoute` & `RoleGuard`)
- **Server State & Caching**: TanStack Query (React Query) v5.50
- **Form Management**: React Hook Form 7.52 with Zod 3.23 schema resolvers
- **HTTP Client**: Axios 1.7 with automated token injection and 401 refresh interceptors
- **Real-Time Client**: Socket.IO Client 4.7
- **Testing**: Vitest 2.0 + React Testing Library 16.0 + jsdom (68+ tests passing)

---

## 4. Repository Structure

```
emr-frontend/
├── src/
│   ├── api/                    # Pure Axios client functions (no direct fetch in UI)
│   ├── assets/                 # SVGs, brand assets, icons
│   ├── components/
│   │   ├── layout/             # AppShell, sticky Sidebar, Header, RoleGuard, ProtectedRoute
│   │   └── ui/                 # Reusable primitives: Button, Card, Badge, Spinner, Modal, Input
│   ├── constants/              # Route definitions, role constants, query keys
│   ├── features/               # Feature modules (appointments, departments, patients, schedules, users)
│   ├── hooks/                  # Custom TanStack Query hooks and debounce utilities
│   ├── pages/                  # Page route components
│   ├── router/                 # React Router hierarchy
│   ├── styles/                 # Global CSS variables, reset, design tokens
│   ├── types/                  # Shared TypeScript interfaces and API response shapes
│   ├── App.tsx                 # App root with QueryClientProvider & RouterProvider
│   └── main.tsx                # React DOM mount point
├── tests/                      # Vitest component and unit test suite
├── ENGINEERING_DECISIONS.md    # Frontend architectural rationale and state design
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 5. Architecture & State Management

For a comprehensive explanation of frontend architectural decisions, see 📖 **[ENGINEERING_DECISIONS.md](./ENGINEERING_DECISIONS.md)**.

### Key Highlights:
1. **Zero Direct Fetching in Components**: Visual components only consume custom hooks (`useAppointments`, `useDoctorSlots`). All networking logic is encapsulated in `src/api/`.
2. **Real-Time Room Synchronization**: Socket.IO listeners update TanStack Query cache in-place (`queryClient.setQueryData`) for instant UI response without manual reloads.
3. **Proactive Duplicate Detection**: Patient registration modal pre-screens Full Name and Date of Birth against the server using debounced queries to prevent accidental duplicates.
4. **Sticky Clinical Layout**: Navigation sidebar remains anchored during long table scrolls, preventing clinician disorientation.

---

## 6. Environment Variables

Create a `.env` file in the root of `emr-frontend/`:

| Variable | Required | Default | Description |
|---|:---:|:---:|---|
| `VITE_API_BASE_URL` | No | `http://localhost:5000/api/v1` | Base URL for backend REST API endpoints. |
| `VITE_WS_URL` | No | `http://localhost:5000` | Base URL for Socket.IO WebSocket server. |

---

## 7. Installation & Execution

### Prerequisites
- Node.js v22+
- npm v10+

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Verify VITE_API_BASE_URL points to running backend
```

### 3. Run Development Server
```bash
npm run dev
```
The application will be accessible at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
npm run preview
```

---

## 8. Automated Testing & Verification

```bash
# Run Vitest component and integration tests (68+ passing)
npm test

# Run TypeScript type check
npm run typecheck

# Run ESLint validation
npm run lint
```

---

## 9. Evaluation Credentials

| Role | Email | Password | Primary Feature to Test |
|---|---|---|---|
| **Super Admin** | `admin@hospital.com` | `Admin@123456` | Departments, Users, Schedules, Audit Logs |
| **Receptionist** | `receptionist.card@hospital.com` | `Recept@123456` | Patient Registration, Slot Picker, Arrive / Cancel |
| **Doctor** | `dr.smith@hospital.com` | `Doctor@123456` | Doctor Queue, Consultation Notes, Complete |
