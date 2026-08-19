# Terraform pilot profile (canonical entry)

**Objective:** Give operators a **single default Terraform footprint** under `infra/terraform-pilot`: opinionated **cost / sampling** variables and **machine-readable nested stack order** for Azure. This root intentionally creates **no Azure resources** - it is the profile and sequencing contract.

**Hosted 3-wave path:** `infra/apply-saas.ps1 -MultiRoot` validates the metadata composition roots (`terraform-foundation`, `terraform-platform`, `terraform-app`) then Azure-applies leaf roots in those waves. Each leaf keeps its own state so resource addresses do not change.

**Legacy isolation path:** `infra/apply-saas.ps1 -LegacyLeafRoots` includes `terraform-orchestrator` after the hosted leaves.

## Default workflow

1. Copy or author a **gitignored** `terraform.tfvars` if you need non-default FinOps knobs (`pilot_monthly_budget_usd`, `app_insights_sampling_percent`, ...).
2. From this directory:

   ```bash
   terraform init
   terraform plan
   ```

3. Use **`terraform output`** (especially `nested_infrastructure_roots`, `composition_roots`, and `cost_variables`) when planning applies in downstream roots, or rely on [infra/apply-saas.ps1](../apply-saas.ps1) (default = **pilot profile only**).

4. When you are ready for hosted sequential applies, run `../apply-saas.ps1 -MultiRoot`. Landing-zone scripts (`scripts/provision-landing-zone.ps1` / `.sh`) wrap that path.

## Guardrails

- **Never** commit secrets; use Key Vault references per [docs/library/CONFIGURATION_KEY_VAULT.md](../../docs/library/CONFIGURATION_KEY_VAULT.md).
- **Naming:** keep `archiforge` out of `infra/**/*.tf` (**`rg "archiforge" infra --glob "*.tf"`**); dedicated CI grep job was retired.

## Related

- [docs/deployment/PILOT_PROFILE.md](../../docs/deployment/PILOT_PROFILE.md) - pilot vs production posture.
- [docs/library/REFERENCE_SAAS_STACK_ORDER.md](../../docs/library/REFERENCE_SAAS_STACK_ORDER.md) - full narrative and wave table.
- [docs/runbooks/TERRAFORM_COMPOSITION_STATE_MV.md](../../docs/runbooks/TERRAFORM_COMPOSITION_STATE_MV.md) - optional post-V1 state merge.
