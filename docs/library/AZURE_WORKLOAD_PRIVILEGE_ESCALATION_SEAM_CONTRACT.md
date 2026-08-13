> **Scope:** Contributor-reference — ranked Azure workload privilege-escalation seams for Container Apps + SQL + Azure OpenAI (TB-1244); not a buyer assurance claim.

# Azure workload privilege-escalation seam matrix (TB-1244)

> **Audience:** Contributors, principal architects, Azure security reviewers, and GTM claim reviewers evaluating CA + SQL + AOAI production posture.  
> **Not** a buyer assurance claim — this contract names **likely escalation seams** and honest pins; it does not certify penetration-test outcomes.

**Buyer / PA one-pager:** [`BUYER_SECURITY_PROCUREMENT_PACKET.md`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#azure-workload-privilege-escalation-seam-m-216) (GTM **M-215** / **M-216**).  
**Path-stable alias:** [`AZURE_WORKLOAD_PRIVILEGE_ESCALATION_SEAM_PA_ONE_PAGER.md`](../go-to-market/AZURE_WORKLOAD_PRIVILEGE_ESCALATION_SEAM_PA_ONE_PAGER.md).  
**MI / SQL / Blob pattern:** [`MANAGED_IDENTITY_SQL_BLOB.md`](../security/MANAGED_IDENTITY_SQL_BLOB.md).  
**Tenant product PE (separate):** [`TENANT_DID_EROSION_AND_ENFORCEMENT_BEYOND_PREDICATES_CONTRACT.md`](TENANT_DID_EROSION_AND_ENFORCEMENT_BEYOND_PREDICATES_CONTRACT.md) (**TB-1232**).  
**Honesty CI:** **TB-1245** Done (`scripts/ci/check_azure_workload_privilege_escalation_seam_honesty.py`). **Private posture:** **TB-903**. **ApiKey residuals:** **TB-906**.

---

## Decision in one line

The **headline Azure privilege-escalation seam** in the Container Apps + SQL + AOAI topology is a **compromised API managed identity that still carries bootstrap / elevated SQL privilege on the request path** (`db_owner`-equivalent documented for schema bootstrap while `enable_api_sql_runtime_identity` defaults **false** and runtime connection wiring is follow-on). Entra + private endpoints + “we use managed identity” do **not** close that seam by themselves.

---

## Ranked seams (CA + SQL + AOAI)

| Rank | Seam | Mechanism (V1 baseline) | Buyer impact if abused | Residual owners |
|------|------|-------------------------|------------------------|-----------------|
| **1** | **SQL bootstrap MI on API request path** | API system-assigned identity documented as **db_owner-equivalent** for DbUp/bootstrap; runtime UAMI split exists in Terraform but defaults off | DDL / break-glass SQL from compromised API process (RCE / stolen MI token / IMDS) | **TB-1244** follow-on: wire `ArchLucidRuntime` + default-on UAMI |
| **2** | **Runtime UAMI off or unwired** | `enable_api_sql_runtime_identity` default **false**; `ConnectionStrings:ArchLucidRuntime` not app-wired | Copy claims least-privilege SQL while request path still uses bootstrap privilege | Same as rank 1 |
| **3** | **Key Vault Secrets User (vault scope)** | API/worker MIs can read secrets at vault scope — not per-secret ACL | Broader secret blast radius than “one connection string” | **TB-906**, KV scoping follow-ons |
| **4** | **Storage Blob Data Contributor (account scope)** | MI may hold account-level blob data plane role | Cross-container blob access within account | `MANAGED_IDENTITY_SQL_BLOB.md`, container scoping |
| **5** | **Search Index Data Contributor + app filter DiD** | Shared index + mandatory OData `$filter` (product DiD) | Retrieval leak if filter bypassed — separate from SQL PE | **TB-1001** / **TB-1232** |
| **6** | **Public CA ingress / no Easy Auth** | JwtBearer / ApiKey enforced in-app; ingress may be public by default | Network exposure — auth is app-layer, not CA Easy Auth | **TB-903** |
| **7** | **Residual ApiKey paths** | AOAI options default, Content Safety, Redis/Cosmos keys where not MI-only | Secret-in-config classes beyond SQL headline | **TB-906** |

**Not the headline:** AOAI workload RBAC is already **Cognitive Services OpenAI User** (not Contributor) in `infra/terraform-container-apps/azure_openai.tf`.

**Separate product seam:** cross-tenant data via unscoped app code — **TB-1232** / **TB-999**, not Azure MI DDL.

---

## Bootstrap vs runtime SQL (pins)

| Path | Intended principal / role | V1 baseline | Safe language |
|------|---------------------------|-------------|---------------|
| **Bootstrap / migrate / DbUp** | Elevated SQL on **dedicated** bootstrap identity or break-glass job | API system-assigned MI carries **db_owner-equivalent** for schema bootstrap (Terraform comments) | “Bootstrap DDL is elevated and isolated from runtime query path **when wired**” |
| **Runtime tenant-data SQL** | `[ArchLucidApp]` or equivalent non-`db_owner` via **runtime UAMI** | `enable_api_sql_runtime_identity` opt-in; runtime CS not app-wired by default | “Runtime least-privilege SQL is **follow-on** until UAMI is on and wired” |
| **Request path today** | Same API MI used for bootstrap + queries when runtime split off | **Headline seam** | **Forbid** “production API SQL is non-`db_owner`” without wired runtime UAMI |

**Pin:** Production query path **must** use a non-`db_owner` principal; DDL/bootstrap **must** be a **separate** principal/job — do not claim both are satisfied while runtime UAMI is off and bootstrap privilege remains on the request-path MI.

---

## AOAI pin

| Item | Pin |
|------|-----|
| Intended workload RBAC | **Cognitive Services OpenAI User** on API/worker system-assigned identities |
| Terraform | `infra/terraform-container-apps/azure_openai.tf` |
| **Forbid** | Selling ArchLucid’s intended AOAI role as **Contributor** |
| Consumed AOAI PE | Often platform-owned — document separately from tenant SQL seam |

---

## Private endpoints / network pin

| Claim | Status |
|-------|--------|
| PE reduces public network exposure for SQL/Blob/etc. | **Allow** |
| PE alone = private data plane / least-privilege SQL | **Forbid** |
| PE without VNet-integrated CA + `publicNetworkAccess` discipline | Residual — **TB-903** |

---

## Key Vault / Blob pins

| Surface | Pin |
|---------|-----|
| Key Vault | **Secrets User** is **vault-scoped** today — not per-secret ACL |
| Blob | Document account vs container scope in `MANAGED_IDENTITY_SQL_BLOB.md` |
| **Forbid** | “KV presence” or “Blob MI” proves SQL least-privilege |

---

## Code / IaC anchors (verification)

| Anchor | Location |
|--------|----------|
| `enable_api_sql_runtime_identity` | `infra/terraform-container-apps/variables.tf`, `main.tf` |
| Bootstrap vs runtime SQL comments | `infra/terraform-container-apps/main.tf` |
| OpenAI User RBAC | `infra/terraform-container-apps/azure_openai.tf` |
| MI SQL/Blob operator guide | `docs/security/MANAGED_IDENTITY_SQL_BLOB.md` |
| Auth safety / production-like guards | `AuthSafetyGuard`, ADR 0020 |

---

## Allow / forbid (GTM-safe)

| Claim / pattern | Status |
|-----------------|--------|
| Disclose bootstrap vs runtime SQL identity split and residuals | **Allow** |
| Headline seam = compromised API MI with bootstrap SQL on request path | **Allow** |
| Pin intended AOAI role = OpenAI **User** | **Allow** |
| Production API SQL is least-privilege / non-`db_owner` while bootstrap MI still on request path | **Forbid** |
| Private endpoints alone = private data plane | **Forbid** |
| ArchLucid intended AOAI role = Contributor | **Forbid** |
| “Compromised API cannot DDL” without identity split | **Forbid** |

---

## CI anchors for **TB-1245**

| Anchor | Purpose |
|--------|---------|
| `scripts/ci/check_azure_workload_privilege_escalation_seam_honesty.py` | Fail least-privilege SQL / PE-equals-private / AOAI-Contributor overclaims |
| `AZURE_WORKLOAD_PRIVILEGE_ESCALATION_SEAM_CONTRACT.md` | Drift guard (this file) |
| Terraform presence | `enable_api_sql_runtime_identity` default + bootstrap comments still documented |
| `MANAGED_IDENTITY_SQL_BLOB.md` cross-link | MI pattern honesty |

---

## Explicit non-claims

- Reopens Done MI/PE wiring (**TB-080** / **TB-091** / **TB-092** / **TB-656**).
- Re-owns tenant DiD / INV-001 product seams (**TB-1232** / **TB-999**).
- Reinstates SQL RLS as the fix.
- Runtime UAMI default-on + `ArchLucidRuntime` app wiring (follow-on engineering).
- Easy Auth on Container Apps.
- CPA SOC 2 or third-party pen-test publication.

---

## Related

- [`MANAGED_IDENTITY_SQL_BLOB.md`](../security/MANAGED_IDENTITY_SQL_BLOB.md)
- [`TENANT_DID_EROSION_AND_ENFORCEMENT_BEYOND_PREDICATES_CONTRACT.md`](TENANT_DID_EROSION_AND_ENFORCEMENT_BEYOND_PREDICATES_CONTRACT.md) · **TB-1232**
- [`BUYER_SECURITY_PROCUREMENT_PACKET.md#azure-workload-privilege-escalation-seam-m-216`](../go-to-market/BUYER_SECURITY_PROCUREMENT_PACKET.md#azure-workload-privilege-escalation-seam-m-216) · GTM **M-215**/**M-216**
- [`TECH_BACKLOG.md`](TECH_BACKLOG.md) **TB-1244**–**TB-1245** · **TB-903** · **TB-906**
