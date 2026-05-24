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
| Map IdP groups → ArchLucid roles (Admin, Operator, Reader, Auditor) | Joint | At least one Admin can sign in |
| Smoke test: Admin + Operator login | Customer | Both roles reach expected UI surfaces |

**SAML helpers:** `archlucid saml test-config` (live appsettings) · `archlucid auth validate-saml` (offline metadata + mapping files)

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

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Customer technical owner | | | |
| ArchLucid implementation lead | | | |
| ArchLucid CSM | | | |
