> **Scope:** Operator cookbook — multi-tenant portfolio rollup (`GET /v1/roi/cross-tenant-portfolio`), Entra directory-key prerequisites, and k-anonymity for platform administrators.

# Multi-tenant portfolio (cross-tenant ROI)

## What it is

`GET /v1/roi/cross-tenant-portfolio` aggregates ROI and risk metrics across every tenant an identity can access, subject to **k-anonymity** (at least five active tenants).

The standalone **Portfolio Dashboard** route (`/portfolio`) is **retired**; it permanently redirects to **Sponsor dashboard** (`/architecture/sponsor-dashboard`), which is the canonical portfolio-overview surface in the architect workspace.

## Prerequisites

Cross-tenant portfolio requires a **directory object key** on the signed-in principal:

- Entra access tokens should include the **`oid`** claim (preferred), or
- `http://schemas.microsoft.com/identity/claims/objectidentifier`

ArchLucid uses this key to resolve which tenants belong to the same directory user for portfolio rollups. Service accounts and local dev principals that lack `oid` cannot use the feature.

## Enabling portfolio access

1. Sign in through Entra ID (not a dev-bypass principal without object-id claims).
2. Confirm the token carries `oid` (decode JWT in your IdP test harness or API logs).
3. Ensure the user has **ReadAuthority** (or higher) on each tenant that should appear in the portfolio.
4. Verify at least **five** tenants with finalized architecture packages if you expect numeric tiles (k-anonymity gate).

Tenant-level SCIM role mapping and scope headers still apply per tenant; portfolio is a read-only rollup, not a scope bypass.

## HTTP 403 — portfolio directory key not configured

When `oid` / objectidentifier is missing, the API returns **403** with RFC 9457 Problem Details:

| Field | Value |
|-------|--------|
| `title` | Portfolio directory key not configured |
| `type` | `https://archlucid.net/errors/portfolio-key-not-configured` |
| `detail` | Explains that the directory object key is missing and to contact an administrator |

API clients and integrators should surface this `detail` to operators; the retired `/portfolio` UI no longer renders a dedicated card.

## Security and cost notes

- **Security:** Portfolio never exposes per-tenant rows when k-anonymity fails; only aggregate counts when the threshold is met.
- **Scalability:** Rollups are bounded by tenant access lists; large directories should prefer dedicated portfolio service accounts with least privilege.
- **Reliability:** Misconfigured IdP claims produce a stable 403 with guidance — not a silent empty dashboard.
- **Cost:** Extra read load scales with accessible tenant count; cache warm paths mirror single-tenant sponsor ROI where enabled.
