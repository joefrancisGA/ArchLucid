> **Scope:** Operators aligning Terraform **remote state** with committed **`infra/**/*.tf`** resource addresses after the ArchLucid rename — greenfield verification, brownfield **`terraform state mv`**, optional DEV/Prod inventory — not application runtime behavior.

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Terraform Phase 7.5 — State alignment runbook

## Greenfield / main-branch IaC posture (V1)

Committed Terraform under **`infra/**/*.tf`** uses **`archlucid`** resource labels only (historical rename initiative closed **2026-04-19**). Representative roots that previously carried **`archiforge`** addresses now declare, for example:

- **`infra/terraform`:** `azurerm_api_management.archlucid`, `azurerm_api_management_api.archlucid`
- **`infra/terraform-monitoring`:** `azurerm_dashboard_grafana.archlucid`, `grafana_folder.archlucid`, `azurerm_monitor_alert_prometheus_rule_group.archlucid_slo`

**Greenfield applies** (first subscription deploy after this posture): remote state is created already aligned — **no** imperative **`state mv`** required.

## Mandatory grep audit (repository acceptance)

Run from repository root (POSIX **`rg`**, or equivalent Ripgrep in CI):

```bash
rg "archiforge" infra --glob "*.tf"
```

**Expect:** zero matches. If any appear, **do not merge** until removed — CI historically blocked this pattern (`terraform-assert-no-archiforge-in-tf`, retired per **`docs/CHANGELOG.md`**); operators still run this grep on Terraform touches.

## Operator rehearsal — remote state vs `.tf`

For **each Terraform root** that has **already been applied** with a remote backend (see **`docs/library/DEPLOYMENT_TERRAFORM.md`**):

```bash
cd infra/<root>
terraform init
terraform plan -detailed-exitcode
terraform state list | rg archiforge || true
```

**Interpretation:**

- **`plan` exit 0** — empty plan; exit **2** — pending changes (investigate before promoting rename/state work).
- **`state list | rg archiforge`** — any hits mean **brownfield** alignment is still required (next section).

## Brownfield — imperative `terraform state mv`

When remote state still lists **`*.archiforge*`** addresses, follow the archived inventory and commands (example moves for APIM and monitoring):

**[`docs/archive/TERRAFORM_STATE_MV_PHASE_7_5_2026_04.md`](../archive/TERRAFORM_STATE_MV_PHASE_7_5_2026_04.md)**

Preconditions: maintenance window, remote state backup, **`terraform plan`** rehearsal on **DEV** before **Prod**.

## Subscription × root inventory (assessment **P1**)

Use this matrix during **`terraform plan` / `state mv`** rehearsals. Subscriptions (owner-provided **2026-05-15**, Default Directory **`joefrancismarch25outlook.onmicrosoft.com`**):

| Subscription | Azure subscription ID |
|--------------|------------------------|
| **ArchLucid DEV** | `8aa56f3b-18bc-43ca-ad45-bad9e811d33b` |
| **ArchLucid Prod** | `aab65184-5005-4b0d-a884-9e28328630b1` |

**Recommended order:** complete **DEV** cleanly before **Prod**. **Prod** showed **$0** spend at inventory time — still confirm whether each root’s backend exists before skipping passes.

| Terraform root | DEV — backend state exists (Y/N) | DEV — `state list` clean (no `archiforge`) | Prod — backend state exists (Y/N) | Prod — `state list` clean (no `archiforge`) |
|----------------|----------------------------------|--------------------------------------------|-------------------------------------|---------------------------------------------|
| `infra/terraform` | | | | |
| `infra/terraform-monitoring` | | | | |
| `infra/terraform-container-apps` | | | | |
| `infra/terraform-sql-failover` | | | | |
| `infra/terraform-storage` | | | | |
| `infra/terraform-private` | | | | |
| `infra/terraform-edge` | | | | |
| `infra/terraform-entra` | | | | |
| `infra/terraform-openai` | | | | |
| `infra/terraform-logicapps` | | | | |
| `infra/terraform-keyvault` | | | | |
| `infra/terraform-servicebus` | | | | |
| `infra/terraform-orchestrator` | | | | |
| `infra/terraform-otel-collector` | | | | |

**Rollback:** reverse each **`terraform state mv`** or restore remote state from backup if the session produces an inconsistent state.

## Related documents

| Audience | Document |
|----------|----------|
| First subscription deploy | [`docs/library/FIRST_AZURE_DEPLOYMENT.md`](../library/FIRST_AZURE_DEPLOYMENT.md) |
| Apply order | [`docs/library/REFERENCE_SAAS_STACK_ORDER.md`](../library/REFERENCE_SAAS_STACK_ORDER.md) |
| Terraform roots map | [`docs/library/DEPLOYMENT_TERRAFORM.md`](../library/DEPLOYMENT_TERRAFORM.md) |
| Phase 7.5 checklist pointer | [`docs/ARCHLUCID_RENAME_CHECKLIST.md`](../ARCHLUCID_RENAME_CHECKLIST.md) |
