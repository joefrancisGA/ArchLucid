# Terraform pilot wrapper (composition)

**Objective:** Document how to apply the **pilot-cost** variant of ArchLucid without collapsing the modular `infra/terraform-*` roots.

This directory is a **thin orchestration stub** — it does **not** duplicate resource modules. Follow [docs/REFERENCE_SAAS_STACK_ORDER.md](../../docs/REFERENCE_SAAS_STACK_ORDER.md) for foundation order.

## Usage

1. Apply **`infra/terraform-private`** → **`terraform-keyvault`** → **`terraform-sql-failover`** with **smaller SKUs** via `*.tfvars`.
2. Apply **`terraform-container-apps`** with **low min replicas** and **single region**.
3. **Skip** `terraform-edge` until you need WAF / custom domains.
4. **Apply** `terraform-monitoring` with **explicit sampling** and **log caps** aligned to pilot (see [docs/deployment/PILOT_PROFILE.md](../../docs/deployment/PILOT_PROFILE.md)).

## Guardrails

- **Never** commit secrets; use **Key Vault references** as documented in [docs/CONFIGURATION_KEY_VAULT.md](../../docs/CONFIGURATION_KEY_VAULT.md).
- **CI** rejects `archiforge` in any `infra/**/*.tf` — keep naming **ArchLucid** / `archlucid`.

## Related files

- `main.tf` — placeholder module wiring points (adjust branch-specific module sources when forking).
- `variables.tf` — cost knobs (documented defaults are **non-authoritative** — set per subscription).
