## ADDED Requirements

### Requirement: pnpm workspace layout
The repository SHALL use pnpm workspaces with a root `pnpm-workspace.yaml` that declares `apps/*` and `packages/*` as workspace members. The root `package.json` SHALL NOT contain application source code; it SHALL only contain workspace-level devDependencies (turbo, typescript) and scripts.

#### Scenario: Root install resolves all workspaces
- **WHEN** a developer runs `pnpm install` from the repository root
- **THEN** all workspace packages SHALL be linked and their dependencies resolved without manual `cd` into each package

#### Scenario: Cross-package dependency via workspace protocol
- **WHEN** `apps/frontend` or `apps/backend` depends on `packages/shared`
- **THEN** the dependency SHALL be declared as `"@helilog/shared": "workspace:*"` in the consuming package's `package.json`

### Requirement: Directory structure
The repository SHALL follow the layout: `apps/backend/` (Hono + Prisma server), `apps/frontend/` (React + Vite client), `packages/shared/` (shared TypeScript types). No application code SHALL exist at the repository root.

#### Scenario: Backend is under apps/
- **WHEN** a developer looks for the Hono server entry point
- **THEN** it SHALL be located at `apps/backend/src/index.ts`

#### Scenario: Frontend is under apps/
- **WHEN** a developer looks for the React entry point
- **THEN** it SHALL be located at `apps/frontend/src/main.tsx`

#### Scenario: Shared package exists
- **WHEN** a developer looks for shared TypeScript types
- **THEN** they SHALL be found in `packages/shared/src/` and importable as `@helilog/shared`

### Requirement: Turborepo build pipeline
The repository SHALL include a `turbo.json` that defines a task pipeline covering `build`, `dev`, `lint`, `db:migrate`, and `db:generate`. The `build` task SHALL declare `dependsOn: ["^build"]` so that `packages/shared` is compiled before `apps/backend` and `apps/frontend`.

#### Scenario: Single command starts all dev servers
- **WHEN** a developer runs `pnpm dev` (or `turbo dev`) from the repository root
- **THEN** both `apps/backend` and `apps/frontend` development servers SHALL start concurrently

#### Scenario: Build respects dependency order
- **WHEN** a developer runs `turbo build` from the repository root
- **THEN** `packages/shared` SHALL be built before `apps/backend` and `apps/frontend`

#### Scenario: Lint runs per package
- **WHEN** a developer runs `turbo lint` from the repository root
- **THEN** the lint script in each workspace package SHALL run independently and in parallel where possible

### Requirement: Root convenience scripts
The root `package.json` SHALL expose `dev`, `build`, and `lint` scripts that delegate to Turborepo, so developers do not need to install turbo globally.

#### Scenario: Developer uses root scripts
- **WHEN** a developer runs `pnpm build` at the repo root
- **THEN** it SHALL invoke `turbo build` and produce compiled output for all packages
