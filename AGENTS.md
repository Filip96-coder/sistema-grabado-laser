# Repository Agent Guide

## Purpose
- This repository is a small MEAN-style app for laser-work orders.
- `frontend/` is an Angular 21 standalone SPA.
- `backend/` is an Express 5 + Mongoose API.
- `vercel.json` rewrites `/api/*` to the deployed Render backend.

## Rule Files Present
- No repo-local `.cursor/rules/` directory was found.
- No repo-local `.cursorrules` file was found.
- No repo-local `.github/copilot-instructions.md` file was found.
- If any of those files are added later, treat them as higher-priority repo rules.

## Working Agreements For Agents
- Check `git status --short` before editing; the worktree may already be dirty.
- Do not overwrite user changes outside your task.
- Prefer small, targeted edits over broad rewrites.
- Keep frontend and backend changes separated by concern.
- Do not introduce new frameworks, state libraries, or UI kits unless explicitly requested.
- Do not assume tests or lint scripts exist; verify first.

## Repository Layout
- `frontend/src/app/components/` contains standalone Angular components.
- `frontend/src/app/services/ordenes.ts` contains the main HTTP/data service.
- `frontend/src/app/models/orden.model.ts` contains frontend domain types.
- `frontend/src/app/app.routes.ts` defines lazy-loaded routes.
- `backend/src/routes/` wires Express endpoints.
- `backend/src/controllers/` contains request handlers and response shaping.
- `backend/src/models/OrdenTrabajo.js` defines the Mongoose schema.
- `backend/src/config/database.js` manages MongoDB connection setup.
- `backend/server.js` is the Node entrypoint.
- `DOCUMENTACION.md` contains the most complete architecture and deployment notes.

## Install Commands
- Root: `npm install`
- Frontend: `npm install --prefix frontend`
- Backend: `npm install --prefix backend`

## Run Commands
- Frontend dev server: `npm start --prefix frontend`
- Frontend Angular CLI direct: `npm exec --prefix frontend ng serve`
- Backend dev server: `npm run dev --prefix backend`
- Backend production-style run: `npm start --prefix backend`

## Build Commands
- Frontend production build: `npm run build --prefix frontend`
- Frontend watch build: `npm run watch --prefix frontend`
- There is no root build script.
- There is no backend build step because the backend runs directly on Node.

## Test Commands
- Frontend default test script: `npm test --prefix frontend`
- Frontend direct Angular test command: `npm exec --prefix frontend ng test`
- Backend: no test script exists today.
- Root: no test script exists today.

## Single-Test Guidance
- Angular schematics are configured with `skipTests: true` in `frontend/angular.json`; the repo currently has no `*.spec.ts` or `*.test.*` files.
- Because there are no committed tests yet, there is no proven in-repo single-test workflow to run right now.
- If you add frontend Vitest specs, use: `npm exec --prefix frontend vitest run src/app/path/to/file.spec.ts`
- To run one named Vitest test when specs exist, use: `npm exec --prefix frontend vitest run src/app/path/to/file.spec.ts -t "test name"`
- Do not document `npm run test -- --watch=false` as reliable here; the current Angular test script rejects `--watch` in this workspace.
- If backend tests are added later, add an explicit package script instead of relying on undocumented runner flags.

## Lint And Formatting Commands
- There is no `lint` script in `frontend/package.json`.
- There is no `lint` script in `backend/package.json`.
- There is no ESLint config in the repo right now.
- Frontend formatting config exists at `frontend/.prettierrc`.
- Safe frontend formatting check: `npm exec --prefix frontend prettier --check "src/**/*.{ts,html,css}"`
- Safe frontend formatting write: `npm exec --prefix frontend prettier --write "src/**/*.{ts,html,css}"`
- No backend formatter is configured; preserve the existing JS style manually unless asked to add tooling.

## Frontend Stack Conventions
- Use standalone Angular components, not NgModules.
- Use `inject(...)` for dependencies instead of constructor injection when following existing files.
- Use Angular signals for simple local UI state (`signal(...)`).
- Use `provideRouter(...)` and lazy `loadComponent(...)` routes.
- Use `ReactiveFormsModule` and reactive forms, not template-driven forms.
- Keep HTTP access inside services, not components.
- Keep route handlers/components thin; push reusable logic into services or helpers.

## Backend Stack Conventions
- Backend code uses CommonJS (`require`, `module.exports`), not ESM.
- Keep Express routers declarative and small.
- Put request logic in controllers, not route files.
- Put persistence rules in Mongoose models.
- Use async/await for controller flow.
- Keep server bootstrap concerns in `server.js` and app wiring in `src/app.js`.

## Import Conventions
- Frontend imports are grouped with framework imports first, then blank line, then local imports.
- Prefer relative imports inside `frontend/src/app/`.
- Backend imports are simple top-of-file `require(...)` statements.
- Do not leave unused imports behind.
- Preserve import ordering style already present in the touched file.

## Formatting Conventions
- Frontend Prettier settings: `singleQuote: true`, `printWidth: 100`, Angular parser for HTML.
- Use semicolons in frontend TypeScript; existing code does.
- Use 2-space indentation in both frontend and backend.
- Keep object literals and arrays multiline when readability improves.
- Match the surrounding file's brace and trailing-comma style.
- Avoid reformatting unrelated files just because Prettier would change them.

## TypeScript Conventions
- `frontend/tsconfig.json` enables strict mode; keep new TypeScript code strict-safe.
- Avoid `any`; prefer explicit interfaces, unions, `Partial<T>`, `Omit<T>`, or narrow local types.
- Existing code has one `as any` in `orden-form.ts`; do not spread that pattern.
- Model API payloads with interfaces in `frontend/src/app/models/`.
- Keep signal types explicit when inference is not obvious.
- Prefer readonly dependencies like `private readonly service = inject(Service)`.

## JavaScript And API Conventions
- Validate through the Mongoose schema first; reuse schema constraints instead of duplicating magic values.
- Keep JSON error responses shaped as `{ error: string }` unless a route already uses another contract.
- Use proper HTTP status codes: `201` create, `404` missing entity, `400` validation, `500` unexpected failure.
- In update flows, preserve `runValidators: true` on `findByIdAndUpdate`.
- Use `.lean()` for read-heavy report generation paths when Mongoose documents are unnecessary.

## Naming Conventions
- Domain naming is Spanish and should stay consistent: `OrdenTrabajo`, `ordenes`, `precio_cop`, `parametros_laser`.
- Angular class names use PascalCase.
- Component file names use kebab-case.
- Backend model names use PascalCase; route/controller filenames use lowercase dotted names like `ordenes.controller.js`.
- Signals and local state variables use descriptive Spanish names such as `cargando`, `guardando`, `error`.
- Do not translate existing domain field names to English unless the whole contract is intentionally migrated.

## Error Handling Conventions
- Components usually expose an `error = signal('')` and set user-facing messages in subscribe error handlers.
- Clear loading and error state before starting async work.
- When a UI action fails, reset loading flags in both success and error paths.
- Backend controllers wrap async logic in `try/catch` and respond with status + JSON.
- Prefer actionable user messages in the frontend and raw validation messages from Mongoose in the backend where already used.
- Keep the global Express error middleware as a last-resort fallback, not the primary validation mechanism.

## Data And Networking Notes
- Frontend service currently points at the deployed backend URL, not localhost.
- XML responses must be requested with `responseType: 'text'`.
- Editing state is temporarily held in the frontend service; reloading the edit page loses that state and redirects.
- Vercel rewrites allow frontend `/api/*` paths in production, but current service code bypasses that by calling the Render URL directly.

## Testing Expectations For New Work
- If you add business logic that can be isolated, add tests with the same change.
- If you add Angular tests, prefer file-targetable Vitest execution.
- If you add backend tests, choose one runner and add explicit `test` and single-test scripts to `backend/package.json`.
- Do not claim a command works unless you verified it in this repo.

## Safe Change Strategy
- Read the touched model, route, service, and component together before editing behavior.
- Keep API contracts aligned across `backend/src/models`, controllers, and `frontend/src/app/models`.
- When changing field names or response shapes, update both frontend and backend in the same task.
- Preserve deployed-environment assumptions unless the task is explicitly about configuration.

## Known Gaps
- No AGENTS.md existed before this file.
- No repo-local Cursor or Copilot rule files exist today.
- No lint scripts are configured.
- No backend tests are configured.
- Frontend test infrastructure is only partially wired: tsconfig references Vitest globals, but no spec files are present.
