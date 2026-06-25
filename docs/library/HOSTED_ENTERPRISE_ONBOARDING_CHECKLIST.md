> **Scope:** Buyer — Hosted SaaS enterprise onboarding checklist for ArchLucid-operated multi-tenant SaaS.

# Hosted SaaS enterprise onboarding checklist

**Audience:** Tenant administrators, implementation engineers, customer success, security reviewers, and procurement reviewers preparing a **hosted ArchLucid enterprise tenant**.

ArchLucid is delivered as hosted SaaS. Enterprise onboarding configures tenant settings, SSO, roles, policy packs, governance workflows, audit export, and optional cloud evidence connections.

> **Quick links**
>
> Task-oriented links for enterprise tenant configuration:
>
> - **[Configure SSO](#workforce-sso)**
> - **[Map roles and groups](#saml-claim-mapping-reference)** · **[Users and roles](/help/operator-auth-roles)**
> - **[Assign policy packs](#default-policy-packs)**
> - **[Enable governance workflow](#governance-enablement)**
> - **[Configure audit export](#audit-export)**
> - **[Connect Azure securely](/help/cloud-connections/azure)**
> - **[Validate first review package](/help/pilot-guide)**
> - **[Prepare procurement/trust review](/help/procurement)** · **[Security and trust](/help/security-trust)**

---

## Onboarding hub {#onboarding-hub}

Use this checklist to track hosted SaaS enterprise onboarding. For task-specific guidance, open:

- **[Configure SSO](#workforce-sso)**
- **[Map roles and groups](#saml-claim-mapping-reference)** · **[Users and roles](/help/operator-auth-roles)**
- **[Assign policy packs](#default-policy-packs)**
- **[Enable governance workflow](#governance-enablement)**
- **[Configure audit export](#audit-export)**
- **[Connect Azure securely](/help/cloud-connections/azure)**
- **[Validate first review package](/help/pilot-guide)**
- **[Prepare procurement/trust review](/help/procurement)** · **[Security and trust](/help/security-trust)**

---

## Tenant provisioning {#tenant-provisioning}

| Step | Owner | Definition of done |
|------|-------|--------------------|
| Create tenant row in ArchLucid SaaS | ArchLucid | Tenant GUID confirmed; commercial tier = **Enterprise** |
| Set negotiated **DataRegion** residency key | ArchLucid | Region matches order form; blob URI map configured when not `default` |
| Create default workspace + project | ArchLucid | Scope headers resolve for first admin login |
| Record customer success + technical owner contacts | ArchLucid Customer Success | Contacts stored in CRM / runbook |

---

## Workforce SSO {#workforce-sso}

Choose **one** workforce authentication path for the tenant (many customers run SAML SP; OIDC JwtBearer is equally supported in V1 GA).

| Step | Owner | Definition of done |
|------|-------|--------------------|
| Decide IdP path: **SAML 2.0 SP** or **OIDC JwtBearer** | Joint | Documented in tenant runbook |
| Pre-flight SAML metadata + claim mapping (if SAML) | Customer IT + ArchLucid | SAML validation passes with zero failures |
| Configure ArchLucid auth mode + endpoints | ArchLucid | Keys documented for your tenant runbook |
| Map IdP groups → ArchLucid roles (Admin, Operator, Reader, Auditor) | Joint | At least one Admin can sign in — see **[SAML claim-mapping reference](#saml-claim-mapping-reference)** |
| Smoke test: Admin + Operator login | Customer admin | Both roles reach expected UI surfaces |

**Operator UI:** [`/settings/identity-providers`](/settings/identity-providers) (read-only catalog) · [`/settings/identity/sso-wizard`](/settings/identity/sso-wizard) (guided tenant row — **not** a claim-mapping wizard).

### SAML claim-mapping reference {#saml-claim-mapping-reference}

ArchLucid workforce authorization expects **`Admin`**, **`Operator`**, **`Reader`**, or **`Auditor`** role strings after assertion processing. Persist mapping in **`ClaimMappingJson`** on the tenant identity-provider row (SSO wizard or ArchLucid support tooling).

**Validate before go-live:** run SAML metadata and claim-mapping validation before production cutover. Procurement FAQ Q4 cross-links this checklist anchor for buyer questionnaires.

<details>
<summary>Advanced: role mapping JSON (admin reference)</summary>

```json
{
  "roleClaimName": "<IdP attribute or claim URI carrying group/role values>",
  "mappings": [
    { "idpValue": "<IdP group or role string>", "archLucidRole": "Admin" }
  ],
  "customGroupClaimRegex": null
}
```

</details>

<details>
<summary>Advanced: SAML assertion examples (admin reference)</summary>

#### Microsoft Entra ID (SAML SP)

| IdP source (typical) | Example IdP value | ArchLucid role | Notes |
|----------------------|-------------------|----------------|-------|
| Entra **Security group** display name | `ArchLucid-Admins` | `Admin` | Prefer stable group **object IDs** in `idpValue` when display names churn |
| Entra security group | `ArchLucid-Operators` | `Operator` | |
| Entra security group | `ArchLucid-Readers` | `Reader` | |
| Entra security group | `ArchLucid-Auditors` | `Auditor` | Required for audit export without Admin |
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

**OIDC alternative:** Many Entra customers use **`JwtBearer`** instead of SAML — map **`roles`** or group overage claims per your IdP runbook.

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

Use **`customGroupClaimRegex`** only when Ping emits full DNs but you prefer to match a stable prefix — validate before production cutover.

</details>

<details>
<summary>Advanced: configuration keys (admin reference)</summary>

**SAML helpers (engineering):** `archlucid auth sso-preflight` (offline merged appsettings) · `archlucid saml test-config` (live appsettings) · `archlucid auth validate-saml` (offline metadata + mapping files)

**Validate before go-live:** `archlucid auth validate-saml --metadata ./idp-metadata.xml --claim-mapping ./claim-mapping.json`

</details>

**SCIM alignment:** When SCIM provisions users (see **SCIM provisioning** below), directory **group display names** should match the **`idpValue`** strings above so deprovisioning and SSO role resolution stay consistent.

---

## SCIM provisioning {#scim-provisioning}

| Step | Owner | Definition of done |
|------|-------|--------------------|
| Issue SCIM bearer token (tenant-scoped) | ArchLucid | Token stored in customer secret manager — never emailed in plain text |
| Configure IdP SCIM endpoint + bearer | Customer IT | Users/groups sync on schedule |
| Map directory groups → ArchLucid roles | Joint | SCIM group display names align with claim-mapping rules |
| Verify deprovisioning removes seat access | Customer IT | Disabled user cannot obtain new sessions |

---

## Default policy packs {#default-policy-packs}

| Step | Owner | Definition of done |
|------|-------|--------------------|
| Review bundled baseline policy packs | Joint | Customer selects baseline packs for pilot systems |
| Assign packs to workspace/project scope | Customer admin | Governance UI shows active packs |
| Validate one committed review package using assigned policy packs | Joint | Findings reference expected policy rules |
| Escalate custom-pack gaps to professional services if needed | ArchLucid Customer Success | Professional services scope agreed when needed |

---

## Governance enablement {#governance-enablement}

| Step | Owner | Definition of done |
|------|-------|--------------------|
| Enable approval workflows | Customer admin | At least one workflow template active |
| Enable pre-commit governance gate (if contracted) | Customer admin | Block/warn behavior matches order form |
| Segregation-of-duties review | Customer security | Approver ≠ sole committer for production paths |
| Complete one end-to-end approval + commit | Joint | Audit trail shows approval and finalized review package |

---

## Audit export {#audit-export}

| Step | Owner | Definition of done |
|------|-------|--------------------|
| Confirm tier retention defaults | Joint | Team 90d · Professional 1y · Enterprise custom |
| Document extended retention (if purchased) | ArchLucid | Extended retention attached to order |
| Schedule periodic CSV export to customer blob (if required) | Customer IT | Audit export automation documented |
| Auditor spot-check: sample export opens in Excel | Customer admin | CSV header + row cap understood |

---

## Evaluation success criteria {#evaluation-success-criteria}

| Step | Owner | Definition of done |
|------|-------|--------------------|
| Agree minimum / target / stretch metrics | Joint | Evaluation scorecard completed |
| Baseline hours + ROI model inputs captured | Customer admin | ROI model populated |
| Executive ROI dashboard reviewed | Customer sponsor | Executive summary or Home panel validated |
| Go/no-go review scheduled (week 6) | ArchLucid Customer Success | Calendar hold with economic buyer |

---

## Integration bridges {#integration-bridges}

| Step | Owner | Definition of done |
|------|-------|--------------------|
| Configure outbound webhooks / Service Bus | Joint | Test payload delivered on one committed review |
| Document dead-letter recovery runbook | ArchLucid | Retry path and monitoring dashboard documented |
| ITSM / Jira correlation (if contracted) | Joint | Finding ↔ ticket linkage verified on one finding |

---

## Azure cloud evidence connection {#azure-cloud-evidence-connection}

Use this section only when the customer wants ArchLucid to use Azure metadata and cost evidence from selected subscriptions. Azure cloud evidence is optional; reviews can also use briefs, diagrams, documents, and uploaded evidence.

**Evidence tier:** cloud-connected (optional).

| Step | Owner | Definition of done |
|------|-------|--------------------|
| Complete in-product wizard (`Settings → Cloud connections`) | Customer admin + ArchLucid Customer Success | RBAC checklist signed off; Reader + Cost Management Reader only; no client secrets stored in ArchLucid |
| Provision customer SP + federated credential (CLI, Terraform, or Bicep) | Customer IT | Application and tenant IDs recorded; federation trusts ArchLucid published managed identity |
| Save connection identifiers in ArchLucid | Customer admin | Connection save succeeds; audit event recorded |
| Run hosted validation pull | Customer admin or ArchLucid | Validation pull accepted for first subscription scope |
| Document security review evidence | Customer security | **[Connect Azure securely](/help/cloud-connections/azure)** · **[Procurement FAQ](/help/procurement)** · **[Security and trust](/help/security-trust)** attached to tenant runbook |

**UI entry:** [`/settings/cloud-connections`](/settings/cloud-connections) guided wizard.

---

## Sign-off {#sign-off}

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Customer technical owner | | | |
| ArchLucid implementation lead | | | |
| ArchLucid Customer Success | | | |
