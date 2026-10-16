# Frontend Engineering Decisions & Architecture

This document details the architectural rationale, state management paradigms, real-time synchronization strategies, security protections, and UX engineering patterns implemented in the `emr-frontend` single-page application.

---

## 1. Architectural Patterns & Directory Structure

### 1.1 Separation of Concerns
The frontend adheres to strict architectural boundaries ensuring zero business logic or direct HTTP fetching leaks into visual UI components:

```
[ Page Component (View/Routing) ]
                │
                ▼
[ Feature Component (Container/Widget) ]
       │                        │
       ▼                        ▼
[ TanStack Query Hook ]    [ Presentational UI Primitives ]
(useAppointments, etc.)    (Button, Modal, Input, Badge)
       │
       ▼
  [ Typed API Client ]
  (appointment.api.ts)
       │
       ▼
 [ Axios Instance + Interceptors ]
       │
       ▼
  [ Backend REST API ]
```

- **`src/api/`**: Pure async functions returning strongly-typed `Promise<ApiResponse<T>>`. No React hooks or component state live here.
- **`src/hooks/`**: TanStack Query custom hooks encapsulating query keys, cache invalidation, loading states, and error handling.
- **`src/components/ui/`**: Reusable design primitives (Button, Card, Badge, Spinner, Modal, Input, Select) with zero domain knowledge.
- **`src/features/`**: Domain-specific feature modules containing interactive forms, tables, modals, and filters (e.g., `features/appointments`, `features/patients`).
- **`src/router/`**: Declarative route hierarchy protected by `ProtectedRoute` and `RoleGuard`.

---

## 2. Server State Management: TanStack Query v5

### 2.1 Cache Strategy & Stale Times
Managing hospital operational data requires balancing freshness with responsiveness:

| Query Type | Stale Time | Garbage Collection (`gcTime`) | Rationale |
|---|---|---|---|
| **Departments Catalog** | 10 minutes | 30 minutes | Static reference data that rarely changes during a session. |
| **Doctor Availability / Schedules** | 2 minutes | 15 minutes | Template changes are infrequent; real-time socket updates invalidate when needed. |
| **Available Slots** | 10 seconds | 2 minutes | High concurrency; slots must reflect bookings rapidly. |
| **Appointments List** | 15 seconds | 5 minutes | Frequently updated; actively synchronized via Socket.IO events. |
| **Patient Directory** | 30 seconds | 10 minutes | Balances search speed with immediate visibility of newly registered patients. |

### 2.2 Cache Invalidation & Consistency
Mutations (such as booking an appointment, changing status to `ARRIVED`, or cancelling) systematically invalidate dependent query keys:
```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ['appointments'] });
  queryClient.invalidateQueries({ queryKey: ['available-slots'] });
  queryClient.invalidateQueries({ queryKey: ['appointment-stats'] });
}
```
This ensures that the receptionist's appointment table, the doctor's daily queue, and the slot booking picker immediately re-synchronize without manual page refreshes.

---

## 3. Real-Time Synchronization via Socket.IO

### 3.1 Room-Scoped Subscriptions
Rather than flooding every client with all hospital events, the application joins specific socket rooms based on user role and clinical context:
- **`department:<departmentId>`**: Listened to by receptionists to receive instant updates when a patient checks in or cancels in their department.
- **`doctor:<doctorId>`**: Listened to by doctors to receive notifications when a patient arrives in their queue (`APPOINTMENT_ARRIVED`).
- **`admin:audit`**: Super Admin room receiving live audit log entries.

### 3.2 Cache Patching vs. Invalidation
When a Socket.IO event arrives (e.g., `appointment:updated`), the client executes a dual-action strategy:
1. **Immediate Cache Patching**: If the updated appointment exists in the active cache query, the document is updated in-place via `queryClient.setQueryData` for 0ms perceptible latency.
2. **Background Invalidation**: `queryClient.invalidateQueries({ queryKey: ['appointments'] })` runs in the background to ensure pagination counts and summary metrics stay 100% accurate.

---

## 4. Form Validation & Duplicate Detection

### 4.1 React Hook Form + Zod Schema Validation
All forms use `react-hook-form` coupled with `@hookform/resolvers/zod`.
- **Field-level validation**: Instant feedback on touched inputs (e.g., phone format, email syntax, required fields).
- **Type inference**: Form data types are automatically inferred from Zod schemas (`z.infer<typeof patientSchema>`), eliminating manual interface duplication.

### 4.2 Proactive Patient Duplicate Pre-Screening
To prevent duplicate patient records:
- In `RegisterPatientModal.tsx`, as the receptionist enters the patient's Full Name and Date of Birth, a debounced query pre-checks the database.
- If an existing patient matches both Full Name and Date of Birth, an inline warning banner appears alerting the receptionist with the existing `patientId`, offering a one-click option to select the existing patient instead of creating an accidental duplicate.

---

## 5. Security & Authentication Architecture

### 5.1 Token Storage & Refresh Flow
- **Access Tokens**: Short-lived (15 minutes), stored in memory or local storage, attached via Axios request interceptor:
  ```typescript
  config.headers['Authorization'] = `Bearer ${token}`;
  ```
- **Refresh Tokens**: Long-lived (7 days), stored in secure `HttpOnly`, `SameSite=Strict` cookies.
- **Silent Refresh Interceptor**: When an API call returns `401 Unauthorized`, the Axios response interceptor triggers a refresh request to `/auth/refresh`. Upon success, the original request is retried seamlessly without disrupting the user. If the refresh token is revoked or expired, the user is redirected cleanly to `/login`.

### 5.2 Role-Based Access Control (RBAC) in Routing
Routes are safeguarded using two layers:
1. **`ProtectedRoute`**: Verifies the presence of an active authentication session.
2. **`RoleGuard`**: Verifies that the current user's role exists in the allowed roles array:
   ```tsx
   <Route element={<RoleGuard allowedRoles={['SUPER_ADMIN']} />}>
     <Route path="/admin/departments" element={<DepartmentsPage />} />
     <Route path="/admin/audit" element={<AuditLogPage />} />
   </Route>
   ```
   Unauthorized attempts trigger an immediate redirect to `/unauthorized` or the user's role-appropriate home view.

---

## 6. UX Engineering & Accessibility

### 6.1 Clinical Usability Principles
- **Sticky Super Admin & Navigation Sidebars**: The navigation sidebar remains fixed (`position: sticky`, `top: 0`, `height: 100vh`) while the main content area scrolls independently. Clinicians never lose navigation context while reviewing lengthy patient lists.
- **Password Visibility Toggles**: All authentication and password fields feature an accessible eye icon button allowing users to inspect passwords before submission.
- **Custom Native Calendar for Date of Birth**: The patient registration calendar uses standardized native date picker controls with formatted helper text (`YYYY-MM-DD`) and constrained max dates preventing future birth dates.
- **Optimized Keyboard Navigation**: All dialogs, dropdowns, and data tables provide clear `:focus-visible` styling (`outline: 2px solid #0a0a0a`) adhering to WCAG AA clinical workplace standards.

---

## 7. Performance Optimizations

1. **Debounced Search Inputs**: Search filters on patient directories and appointment tables use a 300ms debounce hook (`useDebounce`) to eliminate unnecessary network requests while typing.
2. **Server-Side Pagination & Filtering**: The frontend passes structured query params (`page`, `limit`, `search`, `status`, `department`, `date`) to the backend, rendering responsive tables without loading thousands of records into client memory.
3. **Vite Code Splitting**: Route-level code splitting ensures that heavy components (such as audit logs or schedule editors) are only downloaded when accessed.
