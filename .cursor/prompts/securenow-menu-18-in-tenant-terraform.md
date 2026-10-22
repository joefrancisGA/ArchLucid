# SN-DEP-02 — Terraform root for in-tenant SecureNow

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-* prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MENU_AND_EDITIONS_LUNA_PROMPTS.md`

**Depends on:** SN-DEP-01 and SN-COL-01, both **Accepted**. If either is still Proposed, stop and say so.

## Goal

A Terraform root, `infra/terraform-securenow-in-tenant/`, that deploys one SecureNow instance and its collection agent into a customer subscription, private by default, using the services and modules the accepted ADRs chose.

## Read first

- The accepted SN-DEP-01 and SN-COL-01 ADRs. They override this prompt wherever they differ.
- `infra/README.md`, `infra/modules/`, and each existing root the ADR says to reuse
- `infra/terraform-private/` (network and private endpoint patterns)
- `docs/library/DEPLOYMENT_TERRAFORM.md`
- Existing Terraform checks and posture files (`checks.tf`, `posture_checks.tf`) to copy the pattern

## What to build

- Root folder with `versions.tf`, `providers.tf`, `variables.tf`, `main.tf`, `outputs.tf`, `checks.tf`, `README.md`, and `terraform.tfvars.example`.
- Compose existing modules. Where a module needs a new variable, add the variable with a default that keeps current callers unchanged. Do not copy a module into the new root.
- Network: one VNet, private endpoints for SQL, storage, Key Vault, and Azure OpenAI, public network access disabled on each, and no public ingress to the app by default. An optional variable adds a private ingress path the ADR named.
- Identity: user-assigned managed identities for the API, worker, and collection agent, with only the role assignments the ADRs list, each at the narrowest scope.
- Collection agent: the host the SN-COL-01 ADR chose, its storage container, the discovery wiring, and the on-demand trigger wiring.
- App configuration sets `NEXT_PUBLIC_ARCHLUCID_PRODUCT=security`, the edition variable, and the hosting mode from SN-DEP-01.
- `checks.tf` asserts public network access is disabled on every data service and that no role assignment is broader than resource-group scope.
- Resource names for the UHG edition contain no `archlucid`. Use a name prefix variable.

## Tests

1. `terraform fmt -check -recursive` passes for the new root.
2. `terraform init -backend=false` and `terraform validate` pass.
3. A plan with `terraform.tfvars.example` values and the edition set to `uhg` produces no resource name containing `archlucid`. Check with a small script in `scripts/ci/` and wire it like other Terraform checks.
4. Existing roots that use a changed module still validate.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Do not run `terraform apply`. Do not create Azure resources.
- No secrets in tfvars examples. No storage account shared keys. No SAS tokens.
- Do not commit.

## Done when

`infra/terraform-securenow-in-tenant/` validates, deploys SecureNow and its collection agent privately with managed identities and least privilege on paper, and its checks fail if public access or broad roles creep in.
