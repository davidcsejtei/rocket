# claude.md — Coding Instructions

## Scope & Stack

- Target stack: **Node.js**, **JavaScript**, **TypeScript**, **Vue.js**, **NestJS**.
- Default to **TypeScript** for all application code (both frontend and backend). Use JavaScript only where the toolchain requires it (e.g., simple build scripts).

## Golden Rules

1. **Short functions only.** Keep functions focused on one responsibility. Prefer early returns over nested conditionals.
2. **Descriptive names.** Use clear, intention‑revealing names for variables, functions, files, and modules. Avoid abbreviations and cryptic terms.
3. **No comments in code.** Do not add inline comments, block comments, or JSDoc anywhere (including Vue SFCs, NestJS code, tests, configs). Make the code self‑explanatory through naming and structure.
4. **Business logic lives in services.** Never place business rules in controllers, components, routes, or stores. Frontend and backend must both use service layers.
5. **Environment‑specific values in `.env`.** All configuration that varies by environment must come from `.env` (and a committed `.env.example`). Never hardcode secrets or environment‑dependent values.

## Architecture Principles

- **Backend (NestJS)**
  - Layered modules per domain: `module` → `controller` → `service` → `repository` (or data access layer).
  - **Controllers are thin:** map HTTP/WebSocket to service calls only.
  - **Services contain business logic** and orchestrate repositories/clients.
  - **DTOs** validate/transform input; **no logic** in DTOs.
  - Config is injected from environment (e.g., via a config module). No hardcoded constants for env‑dependent values.
- **Frontend (Vue 3)**
  - Use **Composition API** and **TypeScript**.
  - **Components are thin (presentation only):** render UI, emit user intent, delegate to services.
  - **Services contain business logic** and integrate with APIs/stores.
  - **State management** via a small, typed store (e.g., Pinia) for shared state only; avoid putting business rules in the store.
  - **Env usage:** frontend reads only public, prefixed variables provided by the bundler (e.g., `VITE_...`), never secrets.

## Function & Module Guidelines

- Keep functions short and pure where possible; one clear responsibility.
- Prefer small, composable modules over monoliths.
- Use explicit return types in public APIs.
- Avoid `any`; use strict typing and narrow types at the boundaries.
- Fail fast with clear, typed errors; centralize error handling (filters/interceptors on backend, dedicated handlers on frontend).

## Naming Conventions

- Functions: `verbNoun` (e.g., `calculateTotal`, `fetchUserProfile`).
- Booleans start with `is`, `has`, `can`, `should` (e.g., `isValid`, `hasAccess`).
- Collections are plural (e.g., `users`, `items`); singular for single entities.
- Files and folders use consistent, predictable names that reflect their purpose (e.g., `user.service.ts`, `orders.controller.ts`, `useTelemetry.ts`).

## Configuration & Environments

- Provide `.env.example` with all required keys and safe defaults/placeholders.
- Read all environment variables from `.env`; never commit real secrets.
- In the frontend, expose only public variables via the bundler prefix (e.g., `VITE_API_URL`). Do not import server‑side secrets into client bundles.

## Code Organization (Reference Skeletons)

- **Backend (NestJS)**: `src/` contains `modules/<domain>/` with `*.module.ts`, `*.controller.ts`, `*.service.ts`, and an optional `*.repository.ts`.
- **Frontend (Vue)**: `src/components/` for presentational components, `src/services/` for business logic, `src/stores/` for shared state, `src/views/` or `src/pages/` for route views.

## Error Handling & Logging

- Do not swallow errors. Bubble them to centralized handlers.
- Return safe, minimal error details to clients; log diagnostics server‑side.
- Logging is allowed, but keep it concise and meaningful (still no comments in code).

## Testing (Lightweight Baseline)

- Unit tests focus on **services** (business rules). Controllers/components are tested minimally to ensure wiring works.
- Prefer small, deterministic tests; avoid global mutable state.

## Git Hygiene

- Small, focused commits that build and run.
- Commit messages follow: `type(scope): short description` (e.g., `feat(api): add user service`).

## Do / Do Not

- ✅ Do extract business logic into dedicated services on both frontend and backend.
- ✅ Do keep functions short, with descriptive names and explicit return types.
- ✅ Do place all environment‑specific values in `.env` and commit `.env.example`.
- ✅ Do use npm to install any dependencies, even if they are global tools.
- ✅ Do use Vite to create new frontend projects.
- ✅ Do create new frontend projects in a dedicated folder.
- ✅ Do create new backend API projects in a dedicated folder.
- ❌ Do not write comments or JSDoc in any code.
- ❌ Do not put business logic in controllers, components, routes, or stores.
- ❌ Do not hardcode secrets or environment‑dependent values in the codebase.
- ❌ Do not use npx

## Operating Mode for Claude

- Always read this `claude.md` first.
- When details are missing, make a reasonable assumption, proceed, and document the assumption at the top of the generated PR/commit description.
- Produce runnable increments; each step must build and pass basic checks.
