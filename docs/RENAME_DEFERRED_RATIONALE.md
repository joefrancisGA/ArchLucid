# ArchForge → ArchLucid — remaining deferred item (7.8)

## Objective

Record why **Phase 7.8** in `docs/ARCHLUCID_RENAME_CHECKLIST.md` may remain open. **Phase 7.6** (GitHub repo rename to `joefrancisGA/ArchLucid`) is **done (2026-04-19)**. **Phase 7.5** / **7.7** — see checklist and [`FIRST_AZURE_DEPLOYMENT.md`](FIRST_AZURE_DEPLOYMENT.md).

## Items

| Item | Work | Owner / trigger |
|------|------|-----------------|
| ~~**7.5** Terraform rename~~ | **Done (2026-04-19):** removed `moved {}` blocks; APIM API Azure name `archlucid-api`; zero `archiforge` in `infra/**/*.tf`; CI guard. | — |
| ~~**7.6** GitHub repository rename~~ | **Done (2026-04-19):** `joefrancisGA/ArchiForge` → `joefrancisGA/ArchLucid`. | — |
| ~~**7.7** Entra app registrations~~ | **N/A for first tenant:** `infra/terraform-entra/` defines **ArchLucid** display strings; first `terraform apply` creates app registrations. | — |
| **7.8** Developer workspace path rename | Local folder path (`c:\ArchiForge\ArchiForge` → e.g. `c:\ArchLucid\ArchLucid`); optional; IDE/session paths. | You, when convenient. |

## Risk of deferring 7.8

**Low for correctness:** only affects local paths and muscle memory. GitHub remote already points at `ArchLucid`.

## When to revisit 7.8

During a machine refresh or when the `ArchiForge` folder name becomes confusing for onboarding.

## Brownfield Terraform note

If you **already** have remote Terraform state with historical `*.archiforge` addresses, see [`docs/archive/TERRAFORM_STATE_MV_PHASE_7_5_2026_04.md`](archive/TERRAFORM_STATE_MV_PHASE_7_5_2026_04.md). Greenfield subscriptions skip this.
