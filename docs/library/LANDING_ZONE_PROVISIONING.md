> **Scope:** Contributor-reference — Azure landing zone provisioning (ArchLucid) - full detail, tables, and links in the sections below.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).


# Azure landing zone provisioning (ArchLucid)

## Objective

Provide a **repeatable, script-driven** path to validate and (optionally) apply ArchLucid Terraform roots in **safe dependency order**, without merging unrelated stacks into a single Terraform state.

## Assumptions

- Operators have Azure CLI, Terraform 1.5+, and rights to the target subscription.
- Each root under `infra/terraform-*` keeps **its own backend** (or local state for experiments).
- Production cuts over private SQL/storage before disabling public endpoints (see `infra/terraform-private`).

## Constraints

- **Do not expose SMB (port 445)** on the public internet; align with `docs/library/CUSTOMER_TRUST_AND_ACCESS.md`.
- `terraform apply` without review can destroy resources — default automation uses **validate-only** mode.
- Greenfield IaC uses **`archlucid`** naming; first subscription deploy: [`docs/library/FIRST_AZURE_DEPLOYMENT.md`](FIRST_AZURE_DEPLOYMENT.md). See [`V1_DEFERRED.md`](V1_DEFERRED.md) §3 — no brownfield **`state mv`** pre-release.

## Architecture overview

**Nodes:** Three metadata composition roots (`terraform-foundation`, `terraform-platform`, `terraform-app`) plus leaf Terraform roots (each with its own backend).

**Edges:** `infra/apply-saas.ps1 -MultiRoot` encodes wave order (foundation → platform → app). Landing-zone scripts wrap that entry.

**Flows:** validate composition roots → `init` / `validate` / optional `plan`/`apply` per leaf.

## Component breakdown

| Artifact | Role |
|----------|------|
| `infra/apply-saas.ps1` | Canonical orchestrator: hosted 3-wave MultiRoot, optional `-LegacyLeafRoots`, default pilot-only. |
| `scripts/provision-landing-zone.ps1` | Windows wrapper: always `-MultiRoot`; default **ValidateOnly**. |
| `scripts/provision-landing-zone.sh` | POSIX wrapper: same; requires `pwsh`. |
| `infra/terraform-foundation` / `platform` / `app` | Metadata waves (`azure_apply = false`). Never Azure-apply. |
| `infra/environments/*.example.tfvars` | Non-secret sketches; copy into per-root `terraform.tfvars` or pass `-var-file`. |
| `infra/terraform-orchestrator/` | Legacy-only leaf (`-LegacyLeafRoots`); CI validate anchor. |

## Data flow

1. Operator selects environment tier (dev / staging / prod) and prepares tfvars.
2. Run `.\scripts\provision-landing-zone.ps1 -ValidateOnly` (or `-DryRun` to print steps only). This delegates to `infra/apply-saas.ps1 -MultiRoot`.
3. For real infrastructure, configure remote backends per **leaf**, then re-run with `-Plan` or `-Apply`. Do **not** Azure-apply composition roots.

## Security model

- Secrets live in Key Vault / pipeline stores — not committed tfvars.
- Private endpoints and managed identity SQL are **staging/prod** defaults; dev may relax with explicit risk acceptance.

## Operational considerations

- Add CI coverage: `.github/workflows/ci.yml` includes `infra/terraform-orchestrator` in the Terraform validate matrix.
- After apply, run API smoke (`GET /health/ready`, `GET /version`) and `docs/library/V1_RELEASE_CHECKLIST.md` gates.

## Related

- `infra/README.md`
- `infra/apply-saas.ps1`
- `docs/library/GOLDEN_PATH.md`
- `docs/library/DEPLOYMENT_TERRAFORM.md`
- `docs/library/REFERENCE_SAAS_STACK_ORDER.md`
- `docs/library/FIRST_AZURE_DEPLOYMENT.md`
- `docs/library/CUSTOMER_TRUST_AND_ACCESS.md`
- `docs/library/V1_DEFERRED.md` §3
- `docs/runbooks/TERRAFORM_COMPOSITION_STATE_MV.md`
