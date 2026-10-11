# SN-ED-01 — SecureNow edition model

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md`

**Depends on:** SN-MENU-01.

## Goal

SecureNow knows which edition it is running as, `generic` or `uhg`, from deployment configuration. Nothing visible changes in this session. Later prompts read the edition.

## Why

The owner wants a generic SecureNow (framework-neutral compliance, may mention ArchLucid) and a UHG edition (ARC-AMPE first, never mentions ArchLucid, specialized topics later). The two editions are separate deployments. Today the product shell comes from `NEXT_PUBLIC_ARCHLUCID_PRODUCT`, and a browser cookie (`readProductLineCookie`, a dev shuffle) overrides it. An edition that a cookie can flip would let a UHG user see generic branding, so the edition must not work that way.

## Read first

- `archlucid-ui/src/lib/product-line/product-line-id.ts`
- `archlucid-ui/src/lib/product-line/resolve-product-line-id.ts`, `resolve-product-line-id-server.ts`
- `archlucid-ui/src/lib/product-line/product-line-storage.ts`
- `archlucid-ui/src/lib/product-line/product-line-copy.ts` (`PRODUCT_LINE_ENV_NAME`)
- `archlucid-ui/src/lib/product-line/product-line-http-header.ts`
- `archlucid-ui/src/lib/product-line/product-line-route-gate.ts`
- How the API reads the product line, starting from `X-ArchLucid-` product-line header handling in `ArchLucid.Api`
- Every switch over the edition uses a `never` check in its default case, so a new edition fails to compile until handled

## What to build

### UI

In a new folder `archlucid-ui/src/lib/editions/`:

- `securenow-edition-id.ts`: `SECURENOW_EDITION_IDS = ["generic", "uhg"] as const`, the `SecureNowEditionId` type, `DEFAULT_SECURENOW_EDITION_ID = "generic"`, and `isSecureNowEditionId`.
- `resolve-securenow-edition-id.ts`: reads `NEXT_PUBLIC_SECURENOW_EDITION`. Missing or invalid returns `generic`. No cookie, header, or query string can change it.
- `use-securenow-edition.ts`: a hook for client components, if the product-line code has an equivalent hook. Otherwise skip it.

When the edition is `uhg`:

- The product line is locked to `security`. The product-line cookie is ignored. Any UI that offers a product switch is hidden.
- Architecture-only routes are blocked the same way the product-line route gate already blocks them in the security shell.

When the edition is `generic`, product-line behavior is unchanged.

### API

Add `SecureNow:Edition` configuration (`Generic` or `Uhg`, default `Generic`) bound to an options class in its own file, validated at startup. Expose it read-only on the existing endpoint the UI already calls for host or product configuration, if one exists. If none exists, do not add one in this session. List the gap in the session summary.

### Docs

Add one short section to `docs/library/` beside the existing product-line doc (find it from `product-line-copy.ts` references) that names the setting, the two values, and the lock rule. Do not describe UHG-specific features.

## Tests

1. Missing env returns `generic`. `uhg` returns `uhg`. `UHG ` (case and whitespace) returns `uhg`. `other` returns `generic`.
2. With edition `uhg` and a product-line cookie of `architecture`, the effective product line is `security`.
3. With edition `generic` and a product-line cookie of `architecture`, the effective product line is `architecture`, as today.
4. An exhaustive switch over `SecureNowEditionId` compiles, and adding a third id fails to compile.
5. API options binding rejects an unknown edition value at startup.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- One class per file. No `ConfigureAwait(false)` in tests. Prefer explicit types over `var`.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Api/ArchLucid.Api.csproj'`
- From `archlucid-ui`, run the edition and product-line Vitest files and `npx tsc --noEmit -p tsconfig.json`.
- No visible copy change in this session.
- Do not commit.

## Done when

Both the UI and the API can read the SecureNow edition from deployment configuration, a UHG deployment cannot be switched to the Architecture shell, and nothing on screen changed.
