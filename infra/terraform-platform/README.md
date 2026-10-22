# Terraform platform composition root (wave 2)

**Objective:** Metadata contract for the **platform** operator wave. This root creates **no Azure resources** and has **no providers**.

**Azure apply:** sql-failover, storage, redis, cosmos, servicebus, logicapps, openai, then acr via `infra/apply-saas.ps1 -MultiRoot`. Search and Content Safety stay in `terraform-container-apps`.

**Validate only:**

```bash
terraform init -backend=false
terraform validate
terraform fmt -check
```

**Related:** [docs/library/REFERENCE_SAAS_STACK_ORDER.md](../../docs/library/REFERENCE_SAAS_STACK_ORDER.md), [docs/runbooks/TERRAFORM_COMPOSITION_STATE_MV.md](../../docs/runbooks/TERRAFORM_COMPOSITION_STATE_MV.md).
