# Terraform foundation composition root (wave 1)

**Objective:** Metadata contract for the **foundation** operator wave. This root creates **no Azure resources** and has **no providers**.

**Azure apply:** `infra/terraform-private` then `infra/terraform-keyvault` via `infra/apply-saas.ps1 -MultiRoot`. Each leaf keeps its own state file so resource addresses do not change.

**Validate only:**

```bash
terraform init -backend=false
terraform validate
terraform fmt -check
```

**Related:** [docs/library/REFERENCE_SAAS_STACK_ORDER.md](../../docs/library/REFERENCE_SAAS_STACK_ORDER.md), [docs/runbooks/TERRAFORM_COMPOSITION_STATE_MV.md](../../docs/runbooks/TERRAFORM_COMPOSITION_STATE_MV.md).
