# `@archlucid/api-types`

Type-only npm package: **`openapi-typescript`** output for ArchLucid’s canonical **`GET /openapi/v1.json`** snapshot (`openapi-v1.contract.snapshot.json` in `ArchLucid.Api.Tests`).

> Intended for **private / scoped** publishing (`publishConfig.access: "restricted"`). This repo does not publish to the public npm registry by default.

## Versioning

- **`package.json` `version`** should stay aligned with **`info.version`** inside the OpenAPI snapshot (currently **`1.0.0`**).
- **`archlucid.contractInfoVersion`** in `package.json` mirrors the snapshot `info.version`.

When the contract snapshot bumps `info.version`, bump this package’s semver to match (or follow your org’s mapping policy).

## Workspace usage (`archlucid-ui`)

From repo root under `archlucid-ui/`:

```bash
npm install
```

The package **`prepare`** script copies `src/lib/api-types.generated.ts` from `archlucid-ui` and runs **`tsc`**. After regenerating types in the app:

```bash
npm run generate:api-types
npm run build --workspace=@archlucid/api-types
```

`archlucid-ui` runs the workspace build before `next build` so `dist/` exists for type resolution.

## External consumers (packed tarball / private registry)

Install from Verdaccio, GitHub Packages, or file tarball:

```bash
cd packages/api-types
npm pack
npm install --save ./archlucid-api-types-1.0.0.tgz
```

Usage:

```typescript
import type { components, paths } from "@archlucid/api-types";

type Problem = components["schemas"]["ProblemDetails"];
```

**`prepublishOnly`** regenerates `src/api-types.generated.ts` from the snapshot and emits **`dist/`** ESM + declarations—no changes to the repo’s generator apart from invoking the same `openapi-typescript` CLI against the same JSON path.

## Generation pipeline

The canonical developer command on **`archlucid-ui`** remains:

```bash
npm run generate:api-types
```

That writes `archlucid-ui/src/lib/api-types.generated.ts`. This package syncs that file on **`prepare`** so day-to-day edits stay single-sourced in the UI tree until you **`npm pack`** / **`npm publish`**, where **`prepublishOnly`** refreshes from the snapshot.
