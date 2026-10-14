# SVConnect

A MERN school-management platform (React + TypeScript + Vite + Express + MongoDB) with a
**database-driven sidebar**, **role/permission groups**, **23 core modules**, **add-on modules**
and a **student / parent panel**.

## Highlights

- **Database-driven navigation** — `sidebar_menus` + `sidebar_sub_menus` collections are seeded
  from `server/src/platform/catalog.ts` and served through `GET /api/navigation`, filtered by the
  user's role, permission groups and enabled modules.
- **Role & permission groups** — `permission_group.short_code` (one per module) with actions
  `view / create / edit / delete / approve / export`. `permission_student` codes cover the
  student/parent panel. Permissions are enforced in every API, not just hidden in the UI.
- **Generic CRUD engine** — every topic in the catalog has a field schema, so list/create/edit/
  delete forms and tables are generated automatically (`/api/entities/:submenu`).
- **Dashboards & reports** — analytics cards and Recharts visuals for students, staff, fees,
  attendance, income and expenses.
- **Student scoping** — student/parent accounts only see records they own (enforced server-side).

## Modules included

Front Office, Student Information, Fees Collection, Income, Expense, Attendance, Examinations,
Online Examinations, Lesson Plan, Academics, Human Resource, Communicate, Download Center,
Homework, Library, Inventory, Transport, Hostel, Certificate, Front CMS, Alumni, Reports,
System Settings — plus add-ons (Gmeet/Zoom Live Classes, Behaviour Records, Multi Branch,
Two Factor Auth, Online Course, CBSE Exam, QR Attendance, Holiday, Student CV) and the
Student/Parent Panel.

## Tech stack

| Layer     | Stack |
|-----------|-------|
| Frontend  | React 19, TypeScript, Vite, React Router, TanStack Query, Tailwind CSS v4, Lucide, Recharts, React Hook Form |
| Backend   | Node, Express 5, MongoDB, Mongoose, JWT, Zod, Helmet, rate limiting |
| Testing   | Vitest (unit) + Playwright (E2E) |

## Getting started

### 1. Prerequisites

- Node.js 20+
- MongoDB running locally (`mongodb://127.0.0.1:27017`) or a MongoDB Atlas connection string.

### 2. Install

```bash
npm install
```

### 3. Configure environment

```bash
copy server\.env.example server\.env     # Windows
# edit server/.env and set MONGODB_URI + JWT_SECRET
```

### 4. Seed the database

```bash
npm run seed
```

This creates the sidebar menus, permission groups, roles, the admin user, demo users and sample
records.

### 5. Run

```bash
npm run dev
```

- API: http://localhost:4000
- App: http://localhost:5173

### Demo accounts

| Role    | Email                     | Password    |
|---------|---------------------------|-------------|
| Admin   | admin@svconnect.test      | Admin@123   |
| Teacher | teacher@svconnect.test    | Teacher@123 |
| Student | student@svconnect.test    | Student@123 |

## Scripts

| Command             | Description |
|---------------------|-------------|
| `npm run dev`       | Run server + client concurrently |
| `npm run seed`      | Seed menus, roles, users and sample data |
| `npm run build`     | Build client and server |
| `npm test`          | Run Vitest unit tests |
| `npm run test:e2e`  | Run Playwright E2E tests |
| `npm run lint`      | Type-check the client |

## How the database-driven sidebar works

1. `catalog.ts` defines modules and topics with `short_code`, icons and field schemas.
2. `npm run seed` writes them to `sidebar_menus` and `sidebar_sub_menus`.
3. `GET /api/navigation` returns only what the user can see (role + enabled modules + panel).
4. Add-ons only appear when enabled in **System Settings → Modules** and the role has permission.
5. Every write/read API re-checks permissions; hidden menu items are only a UI convenience.

## Project structure

```
svconnect/
  client/                     # React + Vite + Tailwind app
    src/components/           # Layout, Sidebar, Topbar, DataTable, DynamicForm, UI kit
    src/pages/                # Login, Dashboard, ModulePage, Settings/*
    src/lib/                  # api, auth, query, hooks, types, utils
  server/                     # Express + Mongoose API
    src/platform/             # catalog.ts, permissions.ts (source of truth)
    src/models/               # User, Role, PermissionGroup, SidebarMenu/SubMenu, EntityRecord...
    src/modules/              # auth, navigation, dashboard, entities, settings
    src/seed.ts               # database seeding
```
