# Terraform app composition root (wave 3)

**Objective:** Metadata contract for the **app** operator wave. This root creates **no Azure resources** and has **no providers**.

**Azure apply:** entra, container-apps, edge, `infra/terraform` (APIM), then monitoring via `infra/apply-saas.ps1 -MultiRoot`. Orchestrator is legacy-only (`-LegacyLeafRoots`).

**Validate only:**

```bash
terraform init -backend=false
terraform validate
terraform fmt -check
```

**Related:** [docs/library/REFERENCE_SAAS_STACK_ORDER.md](../../docs/library/REFERENCE_SAAS_STACK_ORDER.md), [docs/runbooks/TERRAFORM_COMPOSITION_STATE_MV.md](../../docs/runbooks/TERRAFORM_COMPOSITION_STATE_MV.md).
