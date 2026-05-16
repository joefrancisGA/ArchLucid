> **Scope:** Evaluator-facing demo workspaces (Workspace A Product Tour anchors, stable URLs, and scope headers).

> **Spine docs:** [`DEMO_QUICKSTART.md`](DEMO_QUICKSTART.md), [`demo-quickstart.md`](../library/demo-quickstart.md).

# Demo workspaces (go-to-market)

## Workspace A — Self-demo / Product Tour

**Audience:** Buyers who activate **Try the self-demo** (marketing CTA).

**Synthetic storyline:** Northwind Architects (fabricated reviewer) reviews **Contoso Cloud Platform**. All artifacts, subscriptions, and customer names are **synthetic**.

**Committed review run (`dbo.Runs`):** deterministic GUID **`b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf`** (see `DemoWorkspaceStableIds.ProductTourArchitectureReviewRunId` in **`ArchLucid.Core.Scoping`**).

### Stable UI entry URLs

Next.js redirects legacy **`/runs/*`** to **`/reviews/*`** (`archlucid-ui/next.config.ts`). Use the review shell path for bookmarks and campaigns.

| Variant | Pattern |
|---------|---------|
| **Canonical reviewer deep link** | `{UI_ORIGIN}/reviews/b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf` |
| **Legacy / marketing shorthand** (`NEXT_PUBLIC_SELF_DEMO_URL`) | `{UI_ORIGIN}/runs/b6ab57c8-84b1-8ac6-28d8-d790efcd1dbf` → **301** to `/reviews/...` |

Replace `{UI_ORIGIN}` with your host (local demo: typically `http://localhost:3000`).

### API / scope headers (mandatory triplet)

Run rows are SQL-scoped by **tenant**, **workspace**, and **scope project**. The shell forwards scope on `/api/proxy` via **`x-tenant-id`**, **`x-workspace-id`**, and **`x-project-id`**. Opening `/reviews/{runId}` **without** the matching workspace/project still targets the HTTP default scope (`ScopeIds`), so listings and run detail loads may **miss** the Product Tour fixtures.

For **Workspace A**, align headers (or JWT claims interpreted the same way) to:

| Header | Stable GUID (`ScopeIds.DefaultTenant` environment) |
|--------|-----------------------------------------------------|
| `x-tenant-id` | `11111111-1111-1111-1111-111111111111` |
| `x-workspace-id` | `2b2571e1-1884-62a2-1e8b-15a2a70a0342` |
| `x-project-id` | `9beb918c-83d4-1385-0486-21f341806c5c` |

Local operators can pick **Product Tour — Architecture Review** in the Scope Switcher (`archlucid-ui`); integrations should set the triple explicitly.

Unit coverage: **`DemoTourWorkspaceIdsParityTests`** must match **`DemoWorkspaceStableIds`** literals so marketing anchors never drift silently.

### `IsDemoWorkspace` and billing posture

Development bootstrap inserts **`dbo.TenantWorkspaces.IsDemoWorkspace = 1`** for the Product Tour workspace when migration **`166`** (or **`ArchLucid_Unified_Schema.sql`** parity fragment) deployed the flag. Seeds also tag that workspace so **SKU metering** can exclude scripted fixtures once product code honors the column.

### Read-only stance for evaluators

Today, **enforce read-only evaluator access** operationally (**Entra roles / RBAC**, product role matrix, trial policy) rather than trusting UI alone. Synthetic rows remain authoritative for the storyline; cloning onto non-default tenants is intentionally gated in **`DemoSeedService`** (requires **`ScopeIds.DefaultTenant`** unless product widens seeding intentionally).
