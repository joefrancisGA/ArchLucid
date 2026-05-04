> **Scope:** Platform engineers applying ArchLucid `infra/terraform-*` roots with separate state files; operational safety, ordering contracts, and hand-off variables-not a Terraform tutorial for greenfield IaC authoring.

---

# Terraform cross-root dependency safety

**Objective:** Reduce blast-radius surprises when thirteen Terraform state roots exchange resource IDs via operator-supplied variables (no cross-root `terraform_remote_state`). This complements [REFERENCE_SAAS_STACK_ORDER.md](REFERENCE_SAAS_STACK_ORDER.md) and CI guard `scripts/ci/assert_terraform_root_ordering_sync.py`.

**Related:** [`infra/terraform-pilot/`](../../infra/terraform-pilot/README.md) (machine-readable `nested_infrastructure_roots` + `consumes_from`), [`infra/apply-saas.ps1`](../../infra/apply-saas.ps1) (multi-root plan/apply order), [`scripts/provision-landing-zone.ps1`](../../scripts/provision-landing-zone.ps1) (validate-only sweep; may omit optional roots).

---

## 1. Blast-radius matrix (who can break whom)

| When you change / apply this root in isolation | Other roots at risk | Typical failure mode |
|-----------------------------------------------|---------------------|----------------------|
| `terraform-private` | `terraform-container-apps`, workloads using PE/DNS | Subnet or VNet ID invalid; private DNS link removed; SQL/blob PE broken |
| `terraform-storage` | `terraform-private`, `terraform-container-apps` | Blob URI / storage account ID wrong; queue creation or blob offload fails |
| `terraform-keyvault` | Apps reading secrets by reference | Missing vault or access policy (if wired from this root) |
| `terraform-sql-failover` | DB connectivity (listener / tuning) | Failover group or automatic tuning changes; generally **not** subnet NSG rules (network lives in `terraform-private`) |
| `terraform-servicebus` | Integration consumers, optional queue wiring | Missing topics; subscription filters misaligned with app config |
| `terraform-container-apps` | `terraform-edge`, `terraform-monitoring`, operators | Wrong image, env, or identity; origins for Front Door become unhealthy |
| `terraform-edge` | Public routing only | Breaks HTTPS paths; does not fix broken origins |
| `infra/terraform` (Consumption APIM) | API surface / routing in front of Container Apps | Misrouted APIs or auth at edge |
| `terraform-monitoring` | Observability only | Alert gaps; does not change runtime |

**Assumptions:** Teams keep separate state for ownership isolation; cross-root coupling is **string variables** and human process, not Terraform graph edges.

**Constraints:** No automatic Azure-wide lock prevents an operator with credentials from `terraform apply` in any single root; CI enforces **script/pilot ordering alignment**, not live apply gates.

---

## 2. Canonical multi-root apply order (and why it exists)

**Authoritative sequence** (same order in `infra/terraform-pilot` `nested_infrastructure_roots` and `infra/apply-saas.ps1 -MultiRoot`):

1. **private** - VNet, private DNS, private endpoints (data-plane foundation when enabled).
2. **keyvault** - Secrets vault before apps that reference it.
3. **sql_failover** - Failover group / SQL tuning (IDs often fed into private stack or app config).
4. **storage** - Artifact blob + job queue accounts.
5. **servicebus** - Optional messaging.
6. **logicapps** - Optional Standard Logic Apps (after messaging + DNS exist).
7. **openai** - Optional budgets / hooks.
8. **entra** - App registrations consumed by API/UI identity.
9. **container_apps** - API, worker, UI (+ managed identities, storage RBAC).
10. **edge** - Front Door / WAF to Container App origins.
11. **`infra/terraform`** - Optional Consumption APIM.
12. **monitoring** - Log Analytics / dashboards keyed off workload IDs.
13. **orchestrator** - Minimal root (CI/bootstrap only unless extended).

**Rationale:**

- Identity and networking land **before** workloads that consume subnet IDs and Entra IDs.
- **Storage** sits early so artifact URIs exist before Container Apps reads them (per variable hand-offs below).
- **Edge/APIM last among app-facing stacks** so origin hostnames and health probes resolve to live revisions.

**Note:** [`scripts/provision-landing-zone.ps1`](../../scripts/provision-landing-zone.ps1) validates roots in a **different** sequence (starts with storage) and currently **omits** `infra/terraform-logicapps` CI runs omit that root intentionally for faster validate loops; stderr warns when the provision set differs from pilot. Operators running full stacks should rely on **`apply-saas.ps1 -MultiRoot`** or the pilot order.

---

## 3. Safe-apply checklist (foundational roots)

Before `terraform apply` in **`terraform-private`** or **`terraform-storage`**:

1. Confirm **staging/production** workspace / subscription (see [`AZURE_SUBSCRIPTIONS.md`](AZURE_SUBSCRIPTIONS.md)).
2. Run **`terraform plan`** in downstream roots mentally affected (at least Container Apps + Edge) **before** destructive network changes.
3. Capture **subnet IDs / storage IDs** handed to Container Apps (`-var-files` / secret store)—after replacement, rerun dependent root if IDs change.
4. Verify **rollback**: VNet deletion is usually irreversible without restore from backup/export; prefer additive changes.

---

## 4. Machine-readable order and `consumes_from`

From repo root:

```bash
cd infra/terraform-pilot
terraform init -backend=false
terraform output nested_infrastructure_roots
```

Each object includes **`consumes_from`**: sibling root **ids** (not paths) whose outputs or prerequisites typically feed variables in this root. Empty `[]` means no declared cross-root coupling in pilot metadata-only stacks.

This does **not** replace `terraform graph`; it documents **intent** for operators and tooling.

---

## 5. Cross-root variable hand-off table

| Downstream root | Typical input variable | Upstream source (root / output) | Notes |
|-----------------|-------------------------|----------------------------------|-------|
| `terraform-private` | `storage_account_id` | `terraform-storage` / `storage_account_id` | Private endpoint targets blob storage |
| `terraform-private` | `sql_server_id` | Logical SQL server (created out-of-band or another process) OR aligned with failover stack | ARM ID must match `Microsoft.Sql/servers/{name}` |
| `terraform-container-apps` | `artifact_blob_service_uri` | `terraform-storage` / `primary_blob_endpoint` | Used as `ArtifactLargePayload__AzureBlobServiceUri` |
| `terraform-container-apps` | `artifact_storage_account_id` | `terraform-storage` / `storage_account_id` | RBAC scope for blob + queue roles |
| `terraform-container-apps` | `container_apps_subnet_id` | Dedicated subnet delegated to Container Apps Env (often created beside or within `terraform-private` topology) | When VNet-integrated env; validated by `checks.tf` ARM shape |
| `terraform-edge` | `backend_hostname` | Container App ingress FQDN or APIM hostname | Must match live origin |
| `terraform` (APIM) | Backend URL | Container Apps `/` or APIM-internal pattern per design | Consumption SKU limits apply |

---

## Operational considerations

- **Security:** Least-privilege still depends on RBAC assignments in each root; ordering does not authenticate applies.
- **Reliability:** `azurerm` backend **state locking** applies **per root** only; simultaneous applies in **different** roots are not coordinated.
- **Cost:** Wrong order wastes time on failed applies; destructive network changes drive incident MTTR unrelated to nominal $/hour.
- **Scalability of process:** Prefer pipelines that run `infra/apply-saas.ps1 -MultiRoot` (plan-gated per root) over ad hoc `cd` applies.
