# ArchForge → ArchLucid — deferred rename items (7.5–7.8)

## Objective

Record why **Phase 7.5–7.8** in `docs/ARCHLUCID_RENAME_CHECKLIST.md` stays open without blocking product delivery.

## Items

| Item | Work | Owner / trigger |
|------|------|-----------------|
| **7.5** Terraform `state mv` for resources still addressed as `*.archiforge` | Coordinate maintenance window; follow `docs/runbooks/TERRAFORM_STATE_MV_PHASE_7_5.md`. | Platform / SRE after V1 GA or when Terraform drift becomes painful. |
| **7.6** GitHub repository rename | Updates remotes, badges, fork URLs, integration webhooks. | Org admin + comms plan. |
| **7.7** Entra app registration display names and redirect URIs | No functional break if URLs stable; cosmetic + consent strings. | Identity admin. |
| **7.8** Developer workspace path rename | Local clones and CI path assumptions; high churn for little runtime gain. | Team agreement + doc refresh. |

## Risk of deferral

**Low for correctness:** application behavior and Azure runtime use ArchLucid assemblies, images, and primary config keys. Residual `archiforge` strings are mostly **Terraform state addresses**, **historical SQL object names** (RLS), and **allowlist filenames**.

## When to revisit

- Before a major Terraform refactor or multi-subscription move.
- When customer-facing URLs or Entra branding must match “ArchLucid” exactly.
- After V1 GA when operational bandwidth allows a coordinated rename week.
