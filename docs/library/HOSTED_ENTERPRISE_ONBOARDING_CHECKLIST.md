> **Scope:** customer-facing — hosted SaaS enterprise onboarding checklist for ArchLucid-operated multi-tenant SaaS (tenant administrators, implementation engineers, security, and procurement reviewers).

# Hosted SaaS enterprise onboarding checklist

**Audience:** Tenant administrators, implementation engineers, customer success, security reviewers, and procurement reviewers preparing a **hosted ArchLucid enterprise tenant**.

ArchLucid is delivered as hosted SaaS. Enterprise onboarding configures tenant settings, SSO, roles, policy packs, governance workflows, audit export, and optional cloud evidence connections.

> **Quick links**
>
> Task-oriented links for enterprise tenant configuration:
>
> - **[Configure SSO](#workforce-sso)**
> - **[Map roles and groups](#saml-claim-mapping-reference)** · **[Users and roles](/help/users-and-roles)**
> - **[Assign policy packs](#default-policy-packs)**
> - **[Enable governance workflow](#governance-enablement)**
> - **[Configure audit export](#audit-export)**
> - **[Connect Azure securely](/help/cloud-connections/azure)**
> - **[Validate first architecture review](/help/pilot-guide)**
> - **[Prepare procurement/trust review](/help/procurement)** · **[Security and trust](/help/security-trust)**

---

## Onboarding hub {#onboarding-hub}

Use this checklist to track hosted SaaS enterprise onboarding. For task-specific guidance, open:

- **[Configure SSO](#workforce-sso)**
- **[Map roles and groups](#saml-claim-mapping-reference)** · **[Users and roles](/help/users-and-roles)**
- **[Assign policy packs](#default-policy-packs)**
- **[Enable governance workflow](#governance-enablement)**
- **[Configure audit export](#audit-export)**
- **[Connect Azure securely](/help/cloud-connections/azure)**
- **[Validate first architecture review](/help/pilot-guide)**
- **[Prepare procurement/trust review](/help/procurement)** · **[Security and trust](/help/security-trust)**

---

## Tenant provisioning {#tenant-provisioning}

| Step | Owner | Definition of done |
|------|-------|--------------------|
| Create tenant row in ArchLucid SaaS | ArchLucid | Tenant GUID confirmed; commercial tier = **Enterprise** |
| Set negotiated **DataRegion** residency key | ArchLucid | Region matches order form; regional blob storage configured when not `default` — administrator keys in [Configuration reference](/help/configuration-reference) § Tenant data residency |
| Create default workspace + project | ArchLucid | Scope headers resolve for first admin login |
| Record customer success + technical owner contacts | ArchLucid Customer Success | Contacts stored in CRM / runbook |

---

## Sign-in models {#sign-in-models}

ArchLucid supports **individual passwordless sign-in** through work or school accounts and one-time email codes. **Optional enterprise SSO** lets organizations configure SAML or OpenID Connect. **Tenant-enforced SSO** requires members of verified email domains to use the organization's identity provider for routine access — email-code sign-in is not available as a routine bypass when enforcement applies.

Customer-facing overview: **[Authentication and sign-in](/help/authentication-sign-in)**.

## Workforce SSO {#workforce-sso}

Choose **one** workforce authentication path for the tenant (many customers run SAML SP; OIDC JwtBearer is equally supported in V1 GA).

| Step | Owner | Definition of done |
|------|-------|--------------------|
| Decide IdP path: **SAML 2.0 SP** or **OIDC JwtBearer** | Joint (customer IT + ArchLucid) | Documented in tenant runbook |
| Pre-flight SAML metadata + claim mapping (if SAML) | Customer IT + tenant admin | SAML validation passes with zero failures |
| Configure ArchLucid auth mode + endpoints | ArchLucid | Keys documented for your tenant runbook |
| Map IdP groups → ArchLucid roles (Admin, Architect, Reader, Auditor) | Joint (customer IT + ArchLucid) | At least one Admin can sign in — see **[SAML claim-mapping reference](#saml-claim-mapping-reference)** |
| Smoke test: Admin + Architect login | Tenant admin | Both roles reach expected UI surfaces |

**Workspace settings:** [Identity providers](/administration/identity-providers) (read-only catalog) · [SSO wizard](/administration/identity/sso-wizard) (guided tenant row — **not** a claim-mapping wizard).

### SAML claim-mapping reference {#saml-claim-mapping-reference}

Buyer-facing role labels are **Admin**, **Architect**, **Reader**, and **Auditor**. Identity mappings still emit the claim/API values **`Admin`**, **`Operator`** (Architect), **`Reader`**, and **`Auditor`** after assertion processing. Persist mapping in **`ClaimMappingJson`** on the tenant identity-provider row (SSO wizard or ArchLucid support tooling).

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
| Entra security group | `ArchLucid-Operators` | `Operator` (Architect) | |
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
| Okta group | `ArchLucid Operator` | `Operator` (Architect) | |
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
| Ping group | `archlucid-operators` | `Operator` (Architect) | |
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
| Review bundled baseline policy packs | Joint (customer IT + ArchLucid) | Customer selects baseline packs for pilot systems |
| Assign packs to workspace/project scope | Tenant admin | Governance UI shows active packs |
| Validate one finalized architecture package using assigned policy packs | Joint (customer IT + ArchLucid) | Findings reference expected policy rules |
| Escalate custom-pack gaps to professional services if needed | ArchLucid Customer Success | Professional services scope agreed when needed |

---

## Governance enablement {#governance-enablement}

| Step | Owner | Definition of done |
|------|-------|--------------------|
| Enable approval workflows | Tenant admin | At least one workflow template active |
| Enable pre-commit governance gate (if contracted) | Tenant admin | Block/warn behavior matches order form |
| Segregation-of-duties review | Procurement + security reviewer | Approver ≠ sole committer for production paths |
| Complete one end-to-end approval + finalize | Joint (customer IT + ArchLucid) | Audit trail shows approval and finalized architecture package |

---

## Audit export {#audit-export}

| Step | Owner | Definition of done |
|------|-------|--------------------|
| Confirm tier retention defaults | Joint (customer IT + ArchLucid) | Team 90d · Professional 1y · Enterprise custom |
| Document extended retention (if purchased) | ArchLucid | Extended retention attached to order |
| Schedule periodic CSV export to customer blob (if required) | Tenant admin | Audit export automation documented |
| Auditor spot-check: sample export opens in Excel | Tenant admin | CSV header + row cap understood |

---

## Evaluation success criteria {#evaluation-success-criteria}

| Step | Owner | Definition of done |
|------|-------|--------------------|
| Agree minimum / target / stretch metrics | Joint (customer IT + ArchLucid) | Evaluation scorecard completed |
| Baseline hours + ROI model inputs captured | Tenant admin | ROI model populated |
| Executive ROI dashboard reviewed | Architect | Executive summary or Home panel validated |
| Go/no-go review scheduled (week 6) | Procurement + security reviewer | Calendar hold with economic buyer |

---

## Integration bridges {#integration-bridges}

| Step | Owner | Definition of done |
|------|-------|--------------------|
| Configure outbound webhooks / Service Bus | Joint | Test payload delivered on one finalized review |
| Document dead-letter recovery runbook | ArchLucid | Retry path and monitoring dashboard documented |
| ITSM / Jira correlation (if contracted) | Joint | Finding ↔ ticket linkage verified on one finding |

---

## Azure cloud evidence connection {#azure-cloud-evidence-connection}

Use this section only when the customer wants ArchLucid to use Azure metadata and cost evidence from selected subscriptions. Azure cloud evidence is optional; reviews can also use briefs, diagrams, documents, and uploaded evidence.

**Evidence tier:** cloud-connected (optional).

| Step | Owner | Definition of done |
|------|-------|--------------------|
| Complete in-product wizard (Cloud connections) | Customer cloud admin | RBAC checklist signed off; Reader + Cost Management Reader only; no client secrets stored in ArchLucid |
| Provision customer SP + federated credential (CLI, Terraform, or Bicep) | Customer IT + tenant admin | Application and tenant IDs recorded; federation trusts ArchLucid published managed identity |
| Save connection identifiers in ArchLucid | Tenant admin | Connection save succeeds; audit event recorded |
| Run hosted validation pull | Customer cloud admin | Validation pull accepted for first subscription scope |
| Document security review evidence | Procurement + security reviewer | **[Connect Azure securely](/help/cloud-connections/azure)** · **[Procurement FAQ](/help/procurement)** · **[Security and trust](/help/security-trust)** attached to tenant runbook |

**UI entry:** [Cloud connections](/integrations/cloud-connections) guided wizard.

---

## Sign-off {#sign-off}

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Customer technical owner | | | |
| ArchLucid implementation lead | | | |
| ArchLucid Customer Success | | | |
