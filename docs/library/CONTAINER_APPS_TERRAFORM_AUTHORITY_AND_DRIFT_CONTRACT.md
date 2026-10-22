> **Scope:** Contributor-reference — Container Apps Terraform authority, drift escape classes, and provably authoritative state ladder (**TB-1317**); not a claim that Terraform state alone is source of truth.

# Container Apps Terraform authority + drift escape classes (TB-1317)

> **Audience:** Contributors, operators, and GTM reviewers explaining IaC authority splits on Azure Container Apps.  
> **Not** a claim that `terraform.tfstate` alone is authoritative for every runtime attribute.

**GTM:** **M-233** / **M-234**.  
**CD image ownership:** Done **TB-657** · `container_app_image_ownership.tf`.  
**Drift preflight:** `Assert-TerraformDeploymentDriftPreflight.ps1` · Done **TB-658**.  
**Canary / revision traffic:** **TB-755** / **TB-756**.  
**Honesty CI:** **TB-1318** Done (`scripts/ci/check_container_apps_terraform_authority_honesty.py`).

---

## Decision in one line

**Authoritative** means **declared per-surface ownership + proof loop** — not “Terraform state is the only source of truth for Container Apps.” Image tags, many env/secret blocks, Key Vault **values**, and some scale/revision knobs are **intentionally CD- or portal-managed** with `lifecycle.ignore_changes`.

---

## Escape-class ownership matrix

| Class | Owner | Drift detection today | Notes |
| --- | --- | --- | --- |
| **Container image tag** | CD (`cd.yml` `az containerapp update --image`) | TF ignores image (**TB-657**) | TF seeds warm-start pin only |
| **Runtime env / secret blocks** | CD + ops (`az containerapp update --set-env-vars` / `secret set`) | TF ignores `template[0].container[0].env` and `secret` | Brownfield sets claims outside TF |
| **Revision mode / traffic weights** | TF + canary CD (**TB-755**) | Partial — extend LiveAzure compare for TF-owned attrs | Portal edits possible without doc |
| **Scale min/max + HTTP/KEDA rules** | TF vars (temp **G-OPS-01** overrides documented) | Static preflight + stack doctor (**TB-658**) | RC `min_replicas` toggles are ops-owned |
| **Key Vault secret values** | Key Vault (not TF state) | KV RBAC + rotation runbooks | TF may declare secret **references**, not values |
| **Multi-root apply order** | **TB-655** 3-wave orchestration (`apply-saas.ps1 -MultiRoot`) | Stack doctor + ordering CI | Leaf state unmerged (optional `state mv` post-V1) |

---

## Provably authoritative ladder

| Step | Proof | Does not prove |
| --- | --- | --- |
| **(a)** Inventory every `ignore_changes` with named owner | `container_app_image_ownership.tf`, `main.tf` lifecycle blocks | Live Azure matches declared TF-owned attrs |
| **(b)** Auth-gated `terraform plan -detailed-exitcode` on app root | Planned drift on TF-owned resources | CD-owned image/env/secret parity |
| **(c)** Extend LiveAzure compare for TF-owned scale/revision/env keys | Live vs declared TF-owned subset | Full runtime secret values in state |
| **(d)** Forbid undocumented portal mutation of TF-owned attrs | Ops policy + runbook | Automatic enforcement without plan job |
| **(e)** Optional shrink env/secret ignores by declaring required settings | Reduces silent-ignore surface | Instant brownfield safety |

---

## Allow / forbid (GTM-safe)

| Claim | Status |
| --- | --- |
| Per-surface ownership splits (CD image, ignored env/secret, KV values) | **Allow** |
| Plan + live compare for TF-owned attributes | **Allow** |
| Static drift preflight checks repo/CD wiring | **Allow** |
| “Terraform state alone is SoT for Container Apps” | **Forbid** |
| Preflight / stack doctor alone = no Azure drift | **Forbid** |
| “Scale rules cannot drift because they are in Terraform” | **Forbid** |
| KV secret **presence in TF** = secret **value** authority | **Forbid** |

---

## CI anchors for **TB-1318**

| Anchor | Purpose |
| --- | --- |
| `CONTAINER_APPS_TERRAFORM_AUTHORITY_AND_DRIFT_CONTRACT.md` | Drift guard (this file) |
| `scripts/ci/check_container_apps_terraform_authority_honesty.py` | Fail SoT / silent-ignore / portal-undetected claims |
| Verification | `infra/terraform-container-apps/main.tf`, `container_app_image_ownership.tf`, `Assert-TerraformDeploymentDriftPreflight.ps1`, **TB-657** |

---

## Explicit non-claims

- Does not wire paid Azure `terraform plan` on every PR (named follow-on).
- Does not merge leaf Terraform state (Done **TB-655** ships 3-wave orchestration without nested-module wrap).
- Does not change scale-rule mix (**TB-915**).
- Honesty CI shipped: **TB-1318**.

---

## Related

- [`DEPLOYMENT_CD_PIPELINE.md`](DEPLOYMENT_CD_PIPELINE.md) · **TB-915** · **G-OPS-01** · GTM **M-233** / **M-234**
