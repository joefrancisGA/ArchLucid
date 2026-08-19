# Fix: CI #2152 — `node:path/posix` breaks the client production build (4 jobs)

**Run:** 27395468550 · **Branch:** `ci/fix-idempotency-concurrency-hang-guard` · **Commit:** `e5910318a`
**Priority:** HIGHEST — this single import break fails four CI jobs at once.

## Affected jobs (all fail at `next build`, not on tests)

- `Operator UI: lint, typecheck, production build`
- `Operator UI: Playwright mock functional (mock API)`
- `Operator UI: axe-core WCAG 2.1 A/AA (mock)`
- `Containers: Docker build smoke`

## Symptom

```
Failed to compile.
Module build failed: UnhandledSchemeError: Reading from "node:path/posix" is not handled by plugins (Unhandled scheme).
Import trace for requested module:
node:path/posix
./src/lib/help-markdown-presentation.ts
./src/components/marketing/MarketingAccessibilityMarkdownFragment.tsx
./src/components/HelpSearchPanel.tsx
./src/components/AppShellClient.tsx
> Build failed because of webpack errors
```

## Root cause

`archlucid-ui/src/lib/help-markdown-presentation.ts` line 1 imports Node built-ins:

```typescript
import { dirname, normalize } from "node:path/posix";
```

That module is reached from `HelpSearchPanel.tsx`, which is a **`"use client"`** component
(`AppShellClient` → `HelpSearchPanel` → `MarketingAccessibilityMarkdownFragment` →
`help-markdown-presentation`). Webpack bundles client modules for the browser and cannot resolve
the `node:` scheme, so the production build fails. (This was introduced by commit `378e76ee8`,
"strip internal change-set labels from operator help pages".)

`dirname` and `normalize` are used only inside `resolveRelativeRepoDocPath` (lines 45–60) for
POSIX-style repo doc paths. They can be reimplemented as small pure string helpers so the module
becomes client-safe with no Node dependency.

## Fix

In `archlucid-ui/src/lib/help-markdown-presentation.ts`:

1. **Remove** the Node import on line 1:

```typescript
import { dirname, normalize } from "node:path/posix";
```

2. **Add** two pure POSIX string helpers near the top of the file (after the existing
   `MARKDOWN_FILE_PATTERN` const). Keep them small and single-purpose, with comments explaining
   intent (these replace `node:path/posix` so the module is safe in the client bundle):

```typescript
/** POSIX dirname without the Node `path` module (keeps this module client-bundle safe). */
function posixDirname(path: string): string {
  const lastSlash = path.lastIndexOf("/");

  if (lastSlash < 0) {
    return ".";
  }

  if (lastSlash === 0) {
    return "/";
  }

  return path.slice(0, lastSlash);
}

/** POSIX normalize for forward-slash repo paths: resolves "." and ".." segments. */
function posixNormalize(path: string): string {
  const isAbsolute = path.startsWith("/");
  const segments = path.split("/");
  const resolved: string[] = [];

  for (const segment of segments) {
    if (segment.length === 0 || segment === ".") {
      continue;
    }

    if (segment === "..") {
      if (resolved.length > 0 && resolved[resolved.length - 1] !== "..") {
        resolved.pop();
      } else if (!isAbsolute) {
        resolved.push("..");
      }

      continue;
    }

    resolved.push(segment);
  }

  const joined = resolved.join("/");

  if (isAbsolute) {
    return `/${joined}`;
  }

  return joined.length > 0 ? joined : ".";
}
```

3. **Update** `resolveRelativeRepoDocPath` (currently lines 56–57) to call the local helpers:

```typescript
const sourceDir = posixDirname(sourceDocPath.replace(/^\//, ""));
const joined = posixNormalize(`${sourceDir}/${hrefPath}`);
```

## Verify

- The existing `archlucid-ui/src/lib/help-markdown-presentation.test.tsx` must still pass
  (it exercises `resolveRelativeRepoDocPath` via `prepareHelpMarkdownForPresentation`). If the suite
  does not already cover `..` traversal and `docs/`-rooted paths, add cases:
  - `resolveRelativeRepoDocPath("../OPERATOR_ATLAS.md", "docs/library/operator-shell.md")` →
    `docs/OPERATOR_ATLAS.md`
  - `resolveRelativeRepoDocPath("OPERATOR_ATLAS.md", "docs/library/operator-shell.md")` →
    `docs/library/OPERATOR_ATLAS.md`
  - `resolveRelativeRepoDocPath("docs/START_HERE.md", "docs/library/operator-shell.md")` →
    `docs/START_HERE.md`
- Run a production build locally to confirm the webpack error is gone:
  `cd archlucid-ui; npm run build` (or the repo's build script).
- Grep the file to confirm **no** remaining `node:` import:
  `Select-String -Path archlucid-ui/src/lib/help-markdown-presentation.ts -Pattern 'node:'`

## Guardrail (optional but recommended)

If a `"use client"` module ever needs real filesystem path logic, it belongs in a server-only module
(`server-only` import) or a route handler — not in code reachable from a client component. Do not
re-add `node:path` here.
