# ArchForge → ArchLucid — remaining deferred items (7.6, 7.8)

## Objective

Record why **Phase 7.6** and **7.8** in `docs/ARCHLUCID_RENAME_CHECKLIST.md` remain open without blocking product delivery. **Phase 7.5** (Terraform IaC rename) and **7.7** (Entra app registrations) are **complete for greenfield** — see checklist and [`FIRST_AZURE_DEPLOYMENT.md`](FIRST_AZURE_DEPLOYMENT.md).

## Items

| Item | Work | Owner / trigger |
|------|------|-----------------|
| ~~**7.5** Terraform rename~~ | **Done (2026-04-19):** removed `moved {}` blocks; APIM API Azure name `archlucid-api`; zero `archiforge` in `infra/**/*.tf`; CI guard. | — |
| ~~**7.7** Entra app registrations~~ | **N/A for first tenant:** `infra/terraform-entra/` defines **ArchLucid** display strings; first `terraform apply` creates app registrations. | — |
| **7.6** GitHub repository rename | Updates remotes, badges, fork URLs, integration webhooks. | Org admin + comms plan. |
| **7.8** Developer workspace path rename | Local clones and IDE workspace path (`c:\ArchiForge\ArchiForge` → chosen path); high churn for little runtime gain until team agrees. | Team agreement + doc refresh. |

## Risk of deferral (7.6 / 7.8 only)

**Low for correctness:** application behavior uses ArchLucid assemblies and config keys. Residual `ArchiForge` in **folder paths** or **GitHub org/repo URL** is cosmetic for contributors until renamed.

## When to revisit

- **7.6:** Before public launch or when fork/clone URLs must read “ArchLucid” consistently.
- **7.8:** During a planned developer-machine refresh or monorepo layout change.

## Brownfield Terraform note

If you **already** have remote Terraform state with historical `*.archiforge` addresses, see [`docs/archive/TERRAFORM_STATE_MV_PHASE_7_5_2026_04.md`](archive/TERRAFORM_STATE_MV_PHASE_7_5_2026_04.md). Greenfield subscriptions skip this.
