# OP-03 — Product-line signal (host default + optional header)

**Do not** add a second API host. **Do not** make the header required. **Do not** rename existing `X-ArchLucid-*` headers. **Do not** 403 routes yet (that is **OP-04**).

If a product-line resolver already exists on the API, **extend it — do not add a second accessor**.

## Goal

The API can answer “which product is this request for?” without breaking CLI, MCP, Worker, OpenAPI clients, or local dual-UI (one API, Architecture `:3000` + SecureNow `:3001`).

## Why

Today product line is UI-only (`NEXT_PUBLIC_ARCHLUCID_PRODUCT`). A determined client can call `/v1/runs` from the Security shell’s API. OP-04 cannot 403 without a signal. Locally the **deployment** must stay `both` because one process serves both websites.

## Resolution rules (lock these)

1. **Deployment default** from config: `ProductLine:Deployment` = `architecture` | `security` | `both` (default **`both`**). Bind an options class in Core or Host.Core. Local `appsettings.Development.json` stays `both`.
2. **Optional request header** `X-ArchLucid-Product-Line`: `architecture` | `security` (omit = inherit deployment).
3. **Effective line** = intersection. The request **cannot escalate**:
   - deployment `both` + header `security` → `security`
   - deployment `security` + header missing → `security`
   - deployment `security` + header `architecture` → **still `security`** (ignore / do not 400 in this prompt; OP-04 403s architecture routes)
   - deployment `architecture` + header `security` → **still `architecture`**
4. Invalid header value → ignore (treat as omitted). Do not 400 in this prompt.
5. Anonymous health and OpenAPI do not require the header.

## What to build

1. Options: `ProductLineDeploymentOptions` (one class per file) section `ProductLine`. Property `Deployment` with parse helper. Null-check configuration.
2. `IProductLineRequestAccessor` + implementation that reads `HttpContext` + options. Register in `ArchLucid.Host.Composition` (INV-006 — not a public `IServiceCollection` helper on Api).
3. Constant for the header name next to `ArchLucidHttpHeaders` (do **not** rename other headers). Document it as **optional** in a Swashbuckle/OpenAPI operation filter or document-level parameter so `/openapi/v1.json` **adds** the header without making it required. Follow `docs/library/API_CONTRACTS.md`. If the snapshot changes, regenerate with the repo’s OpenAPI snapshot script; do not hand-edit the giant JSON.
4. **UI:** Security Next.js process (`NEXT_PUBLIC_ARCHLUCID_PRODUCT=security`) forwards the header on the BFF `/api/proxy` path. Architecture process may omit it. Reuse the existing proxy header-forward list; do not send it to third-party origins.
5. Unit tests (one class per file): matrix of deployment × header → effective line; invalid header; null HttpContext / missing header. No `ConfigureAwait(false)`.
6. Do **not** change `product-line-catalog.ts` hrefs.

## Acceptance criteria

- Default config remains `both` so `.\scripts\start-local-api-and-ui.ps1` still shares one API.
- OpenAPI change is additive (optional header). Existing clients keep working.
- `dotnet test` scoped to the new tests + any OpenAPI snapshot test the repo already runs for header docs **if** you touched the snapshot (then you must refresh it).
- Architecture UI still works without the header.

## Constraints

- SN-05: do not invent a **required** API field. Optional header + host config only.
- Do not set `ProductLine:Deployment=security` in shared SaaS appsettings. That is a future Container App env, not this prompt.
- Do not 403 (OP-04).
- One class per file. Concrete types. Null-check.
- Working-tree safety on every tracked path.
- If OpenAPI snapshot refresh also regenerates `archlucid-ui/src/lib/api-types/`, stage those generated files in the same commit.
