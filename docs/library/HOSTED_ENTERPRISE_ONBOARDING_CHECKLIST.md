> **Scope:** Hosted Enterprise onboarding — ArchLucid-operated SaaS only (not self-hosted).

> **Spine doc:** [`START_HERE.md`](../START_HERE.md).

# Hosted Enterprise onboarding checklist

**Audience:** Implementation engineers, customer success, and sales engineering onboarding **ArchLucid-hosted SaaS Enterprise** tenants.

**Hosting model:** This checklist applies to **ArchLucid-operated multi-tenant SaaS**. **Self-hosted Enterprise** (customer VNet, customer-operated Kubernetes/SQL) is **V2** per [`V1_DEFERRED.md`](V1_DEFERRED.md) §6t — do not use this checklist for self-hosted deals.

**Related:** [`CUSTOMER_ONBOARDING_PLAYBOOK.md`](../go-to-market/CUSTOMER_ONBOARDING_PLAYBOOK.md) · [`PROCUREMENT_FAQ.md`](../go-to-market/PROCUREMENT_FAQ.md) · [`PILOT_SUCCESS_SCORECARD.md`](../go-to-market/PILOT_SUCCESS_SCORECARD.md)

---

## 1. Tenant provisioning

| Step | Owner | Definition of done |
|------|-------|--------------------|
| Create tenant row in ArchLucid SaaS (`dbo.Tenants`) | ArchLucid ops | Tenant GUID confirmed; commercial tier = **Enterprise** |
| Set negotiated **`DataRegion`** residency key | ArchLucid ops | Region matches order form; blob URI map configured when not `default` |
| Create default workspace + project | ArchLucid ops | Scope headers resolve for first admin login |
| Record CSM + technical owner contacts | ArchLucid CSM | Contacts stored in CRM / runbook |

---

## 2. Workforce SSO (SAML SP or OIDC)

Choose **one** primary workforce path (many customers run SAML SP; OIDC `JwtBearer` is equally supported in V1 GA).

| Step | Owner | Definition of done |
|------|-------|--------------------|
| Decide IdP path: **SAML 2.0 SP** or **OIDC JwtBearer** | Joint | Documented in tenant runbook |
| Pre-flight SAML metadata + claim mapping (if SAML) | Customer IT + ArchLucid | `archlucid auth validate-saml --metadata <idp.xml> --claim-mapping <mapping.json>` passes with zero failures |
| Configure ArchLucid auth mode + endpoints | ArchLucid ops | Keys documented in [`CONFIGURATION_REFERENCE.md`](CONFIGURATION_REFERENCE.md) / [`SECURITY.md`](SECURITY.md) |
| Map IdP groups → ArchLucid roles (Admin, Operator, Reader, Auditor) | Joint | At least one Admin can sign in — see **[§2.1 SAML claim-mapping reference](#saml-claim-mapping-reference)** |
| Smoke test: Admin + Operator login | Customer | Both roles reach expected UI surfaces |

**SAML helpers:** `archlucid saml test-config` (live appsettings) · `archlucid auth validate-saml` (offline metadata + mapping files)

**Operator UI:** [`/settings/identity-providers`](/settings/identity-providers) (read-only catalog) · [`/settings/identity/sso-wizard`](/settings/identity/sso-wizard) (guided tenant row — **not** a claim-mapping wizard). Claim-mapping tables below are the V1 contract.

### 2.1 SAML claim-mapping reference {#saml-claim-mapping-reference}

ArchLucid workforce authorization expects **`Admin`**, **`Operator`**, **`Reader`**, or **`Auditor`** role strings after assertion processing (see [`SECURITY.md`](SECURITY.md) RBAC table). Persist mapping in **`ClaimMappingJson`** on the tenant identity-provider row (SSO wizard or ops tooling) using this JSON shape:

```json
{
  "roleClaimName": "<IdP attribute or claim URI carrying group/role values>",
  "mappings": [
    { "idpValue": "<IdP group or role string>", "archLucidRole": "Admin" }
  ],
  "customGroupClaimRegex": null
}
```

**Validate before go-live:** `archlucid auth validate-saml --metadata ./idp-metadata.xml --claim-mapping ./claim-mapping.json` (Improvement archived **#4**). Procurement FAQ Q4 cross-links this checklist anchor for buyer questionnaires.

#### Microsoft Entra ID (SAML SP)

| IdP source (typical) | Example IdP value | ArchLucid role | Notes |
|----------------------|-------------------|----------------|-------|
| Entra **Security group** display name | `ArchLucid-Admins` | `Admin` | Prefer stable group **object IDs** in `idpValue` when display names churn |
| Entra security group | `ArchLucid-Operators` | `Operator` | |
| Entra security group | `ArchLucid-Readers` | `Reader` | |
| Entra security group | `ArchLucid-Auditors` | `Auditor` | Required for **`GET /v1/audit/export`** without Admin |
| Entra **App role** assignment | `Admin` | `Admin` | When using enterprise app roles instead of groups |

**Suggested `roleClaimName` values (pick one that matches your assertion):**

| Assertion shape | `roleClaimName` |
|-----------------|-----------------|
| Group Object IDs in **`http://schemas.microsoft.com/ws/2008/06/identity/claims/groups`** | `http://schemas.microsoft.com/ws/2008/06/identity/claims/groups` |
| Group display names via custom SAML attribute | Your custom attribute name (must match assertion XML) |
| App roles in **`roles`** | `roles` |

**Example `claim-mapping.json` (group Object IDs):**

```json
{
  "roleClaimName": "http://schemas.microsoft.com/ws/2008/06/identity/claims/groups",
  "mappings": [
    { "idpValue": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee", "archLucidRole": "Admin" },
    { "idpValue": "11111111-2222-3333-4444-555555555555", "archLucidRole": "Operator" },
    { "idpValue": "66666666-7777-8888-9999-000000000000", "archLucidRole": "Reader" },
    { "idpValue": "aaaa1111-bbbb-2222-cccc-dddd3333eeee", "archLucidRole": "Auditor" }
  ]
}
```

**OIDC alternative:** Many Entra customers use **`JwtBearer`** instead of SAML — map **`roles`** or group overage claims per [`GENERIC_OIDC_SETUP.md`](../runbooks/GENERIC_OIDC_SETUP.md) and [`appsettings.Entra.sample.json`](../../ArchLucid.Api/appsettings.Entra.sample.json).

#### Okta (SAML SP)

| IdP source (typical) | Example IdP value | ArchLucid role | Notes |
|----------------------|-------------------|----------------|-------|
| Okta **Group** name | `ArchLucid Admin` | `Admin` | Match the string Okta emits in the SAML attribute you select |
| Okta group | `ArchLucid Operator` | `Operator` | |
| Okta group | `ArchLucid Reader` | `Reader` | |
| Okta group | `ArchLucid Auditor` | `Auditor` | |

**Suggested `roleClaimName` values:**

| Assertion shape | `roleClaimName` |
|-----------------|-----------------|
| Okta **Groups** attribute (default filter) | `groups` |
| Custom SAML attribute for role strings | Name from Okta **Attribute Statements** (often `roles`) |

**Example `claim-mapping.json`:**

```json
{
  "roleClaimName": "groups",
  "mappings": [
    { "idpValue": "ArchLucid Admin", "archLucidRole": "Admin" },
    { "idpValue": "ArchLucid Operator", "archLucidRole": "Operator" },
    { "idpValue": "ArchLucid Reader", "archLucidRole": "Reader" },
    { "idpValue": "ArchLucid Auditor", "archLucidRole": "Auditor" }
  ]
}
```

**OIDC alternative:** See [`SSO_OKTA_CONFIGURATION.md`](../integrations/SSO_OKTA_CONFIGURATION.md) §2.3–§2.4 for **`roles`** claim mapping on access tokens.

#### Ping Identity (PingFederate / PingOne — SAML SP)

| IdP source (typical) | Example IdP value | ArchLucid role | Notes |
|----------------------|-------------------|----------------|-------|
| Ping **group** membership | `archlucid-admins` | `Admin` | Use the same string Ping sends in the SAML attribute |
| Ping group | `archlucid-operators` | `Operator` | |
| Ping group | `archlucid-readers` | `Reader` | |
| Ping group | `archlucid-auditors` | `Auditor` | |

**Suggested `roleClaimName` values:**

| Assertion shape | `roleClaimName` |
|-----------------|-----------------|
| **`memberOf`** LDAP attribute via Ping adapter | `memberOf` |
| Custom **`groups`** attribute | `groups` |
| PingOne **Roles** claim | `roles` |

**Example `claim-mapping.json`:**

```json
{
  "roleClaimName": "memberOf",
  "mappings": [
    { "idpValue": "cn=archlucid-admins,ou=groups,dc=example,dc=com", "archLucidRole": "Admin" },
    { "idpValue": "cn=archlucid-operators,ou=groups,dc=example,dc=com", "archLucidRole": "Operator" },
    { "idpValue": "cn=archlucid-readers,ou=groups,dc=example,dc=com", "archLucidRole": "Reader" },
    { "idpValue": "cn=archlucid-auditors,ou=groups,dc=example,dc=com", "archLucidRole": "Auditor" }
  ],
  "customGroupClaimRegex": "^cn=archlucid-([a-z]+),"
}
```

Use **`customGroupClaimRegex`** only when Ping emits full DNs but you prefer to match a stable prefix — validate with `archlucid auth validate-saml` before production cutover.

**SCIM alignment:** When SCIM provisions users (§3), directory **group display names** should match the **`idpValue`** strings above so deprovisioning and SSO role resolution stay consistent.

---

## 3. SCIM provisioning (Enterprise)

| Step | Owner | Definition of done |
|------|-------|--------------------|
| Issue SCIM bearer token (tenant-scoped) | ArchLucid ops | Token stored in customer secret manager — never emailed in plain text |
| Configure IdP SCIM endpoint + bearer | Customer IT | Users/groups sync on schedule |
| Map directory groups → ArchLucid roles | Joint | SCIM group display names align with claim-mapping rules |
| Verify deprovisioning removes seat access | Customer IT | Disabled user cannot obtain new sessions |

---

## 4. Default policy pack assignments

| Step | Owner | Definition of done |
|------|-------|--------------------|
| Review bundled packs in [`DEFAULT_POLICY_PACKS_V1.md`](../go-to-market/DEFAULT_POLICY_PACKS_V1.md) | Joint | Customer selects baseline packs for pilot systems |
| Assign packs to workspace/project scope | Customer Admin (guided) | Governance UI shows active packs |
| Run one committed manifest with packs enabled | Joint | Findings reference expected policy rules |
| Escalate custom-pack gaps to PS SKU if needed | ArchLucid CSM | [`PRICING_PHILOSOPHY.md`](../go-to-market/PRICING_PHILOSOPHY.md) §4.2 |

---

## 5. Governance enablement

| Step | Owner | Definition of done |
|------|-------|--------------------|
| Enable approval workflows | Customer Admin | At least one workflow template active |
| Enable pre-commit governance gate (if contracted) | Customer Admin | Block/warn behavior matches order form |
| Segregation-of-duties review | Customer security | Approver ≠ sole committer for production paths |
| Complete one end-to-end approval + commit | Joint | Audit trail shows approval + `ManifestFinalized` |

---

## 6. Audit export path

| Step | Owner | Definition of done |
|------|-------|--------------------|
| Confirm tier retention defaults | Joint | Team 90d · Professional 1y · Enterprise custom — see [`PRICING_PHILOSOPHY.md`](../go-to-market/PRICING_PHILOSOPHY.md) |
| Document extended retention (if purchased) | ArchLucid ops | [`AUDIT_RETENTION_EXTENSION.md`](AUDIT_RETENTION_EXTENSION.md) attached to order |
| Schedule periodic CSV export to customer blob (if required) | Customer ops | `GET /v1/audit/export` automation documented in [`AUDIT_RETENTION_POLICY.md`](AUDIT_RETENTION_POLICY.md) |
| Auditor spot-check: sample export opens in Excel | Customer | CSV header + row cap understood |

---

## 7. Pilot success criteria

| Step | Owner | Definition of done |
|------|-------|--------------------|
| Agree minimum / target / stretch metrics | Joint | [`PILOT_SUCCESS_SCORECARD.md`](../go-to-market/PILOT_SUCCESS_SCORECARD.md) §2 completed |
| Baseline hours + ROI model inputs captured | Customer champion | [`ROI_MODEL.md`](../go-to-market/ROI_MODEL.md) populated |
| Executive ROI dashboard reviewed | Customer sponsor | `GET /v1/roi/executive-summary` or Home panel validated |
| Go/no-go review scheduled (week 6) | ArchLucid CSM | Calendar hold with economic buyer |

---

## 8. Integration bridges (optional Enterprise)

| Step | Owner | Definition of done |
|------|-------|--------------------|
| Configure outbound webhooks / Service Bus | Joint | Test payload delivered: `archlucid integration simulate-webhook --event-type RunCommitted --target-url <url>` |
| Document dead-letter recovery runbook | ArchLucid ops | `archlucid integration retry-dead-letter` + monitoring dashboard |
| ITSM / Jira correlation (if contracted) | Joint | Finding ↔ ticket linkage verified on one finding |

---

## 9. Tier 2 Azure continuous ingestion (optional Enterprise)

Use when the customer opts into **hosted Tier 2** Workload Identity Federation pull (on-demand `POST /v1/admin/azure-extractor/hosted/run` and future auto-pull). Tier 1 PowerShell ZIP upload remains the default V1 GA path.

| Step | Owner | Definition of done |
|------|-------|--------------------|
| Complete in-product Tier 2 wizard (`Settings → Cloud connections`) | Customer Admin + ArchLucid CSM | RBAC checklist signed off; Reader + Cost Management Reader only; no client secrets stored in ArchLucid |
| Provision customer SP + federated credential (CLI, Terraform, or Bicep) | Customer IT | `customer_app_id` + `customer_tenant_id` recorded; federation trusts ArchLucid published MI |
| Save connection identifiers in ArchLucid | Customer Admin | `POST /v1/azure-extractor/connections` succeeds; audit `Integration.HostedAzureExtractorConfigured` |
| Run hosted validation pull | Customer Admin or ArchLucid ops | `POST /v1/admin/azure-extractor/hosted/run` returns **202** for first subscription scope |
| Document security review evidence | Customer security | [`PROCUREMENT_FAQ.md`](../go-to-market/PROCUREMENT_FAQ.md) + [`trust-center.md`](../go-to-market/trust-center.md) + [`AZURE_EXTRACTOR.md`](AZURE_EXTRACTOR.md) attached to tenant runbook |

**UI entry:** `/settings/cloud-connections` guided wizard (Improvement #17).

---

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Customer technical owner | | | |
| ArchLucid implementation lead | | | |
| ArchLucid CSM | | | |
