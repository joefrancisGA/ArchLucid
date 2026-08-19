> **Reviewed:** 2026-07-26

# Architecture Review Packet: B2B SaaS Tenant Migration Platform

**Classification:** Sanitized synthetic packet for principal architect evaluation  
**Domain:** Multi-tenant SaaS / tenant migration / audit exports  
**Length target:** 8–15 page review-session packet  
**Use:** Participant raw material for ArchLucid principal-architect insight validation

---

## 1. Business context

VertexFlow Software is moving from per-customer single-tenant deployments to a shared B2B SaaS platform. The pilot migrates three low-risk customers. The sponsor wants faster tenant onboarding, lower hosting cost, usage metering, SSO, and tenant audit exports.

The packet is intentionally realistic rather than polished. It includes open questions, scope deferrals, cross-boundary assumptions, and implementation notes that may or may not be acceptable depending on risk tolerance.

---

## 2. System overview

| Component | Description |
|---|---|
| Tenant Control Plane | Registration, plans, feature flags |
| Web/API Application | Shared application services |
| Tenant Data Store | Shared DB with tenant-scoped rows |
| Background Job Processor | Async workflows, notifications, exports |
| Billing Metering Service | Records usage events |
| Audit Export Service | Exports tenant-scoped audit logs |
| Admin Console | Internal support and tenant administration |
| Migration Tool | Imports legacy tenant data |

---

## 3. User types and trust boundaries

| Actor | Trust origin | Interaction |
|---|---|---|
| Tenant end user | External customer tenant | Web/API |
| Tenant admin | External customer tenant | Admin functions |
| Customer SSO IdP | External customer | SAML/OIDC |
| Internal support agent | Internal | Support console/impersonation |
| Billing service | Internal service | Usage events |
| Migration operator | Internal | Migration tooling |
| Audit consumer | Customer compliance | Export download |

Reviewers should pay special attention to where data, identity, operational responsibility, and auditability cross boundaries.

---

## 4. Main request and data flows

1. Tenant onboarding creates tenant, configures SSO, applies feature flags, invites users.
2. User request resolves tenant context, queries shared DB, and emits audit event.
3. Background job message includes tenant ID and writes results/audit event.
4. Support impersonation opens an impersonated session after manager chat approval.
5. Audit export writes tenant-specific file to Blob Storage and generates download link.

---

## 5. Data classification and retention

| Data category | Classification | Retention |
|---|---|---|
| Tenant workflow records | Customer confidential | Contract |
| User identity attributes | Personal data | Account lifetime |
| Audit events | Compliance evidence | 7 years |
| Billing usage events | Financial | 7 years |
| Migration imports | Customer confidential | 30 days after cutover |
| Export files | Customer confidential | 14 days active |

---

## 6. Security and identity model

- Tenant isolation uses application-layer tenant context and DB filters.
- Shared schema has TenantId on tenant-owned tables.
- Global reference tables do not include TenantId.
- Dapper repositories accept tenant context for tenant-scoped queries.
- Some reporting queries join tenant data to global lookup tables.
- Support impersonation is logged but not separately approved in system.
- Migration tool runs with elevated database permissions.

---

## 7. Reliability, resiliency, and performance

- Availability target is 99.9% for pilot.
- RPO is 15 minutes; RTO is 4 hours.
- Audit export must generate within 30 minutes.
- No tenant-level noisy-neighbor controls in phase one.
- Billing metering is async.
- Audit export jobs may run during business hours.

---

## 8. Operational model

The operating team intends to use standard CI/CD deployment with environment-specific configuration, centralized logs, metrics, and alerting. Some business operations are business-hours only, while the technical platform has after-hours escalation for critical incidents. Reviewers should examine whether the stated operational model is sufficient for the stated business goals, data sensitivity, and pilot commitments.

---

## 9. Architecture decisions / ADRs

### ADR-001: Shared DB with TenantId

**Decision/rationale:** Reduce cost/complexity; requires strong tenant-filter proof.

### ADR-002: Support impersonation for pilot

**Decision/rationale:** Reduce support friction; requires strong audit/approval.

### ADR-003: Async billing metering

**Decision/rationale:** Avoid slowing requests; requires reconciliation.

### ADR-004: Manual migration rollback

**Decision/rationale:** Backup restore for pilot; timing/data risks.

---

## 10. Known constraints and open questions

The pilot is time-boxed and intentionally defers some production-hardening work. Reviewers should distinguish acceptable pilot risk from decisions that are likely to become unsafe production defaults.

Common review prompts:

1. Which deferred decision creates the greatest future risk?
2. Which trust boundary is least clearly protected?
3. Which operational assumption could fail during the first pilot?
4. Which evidence item is strongest?
5. Which finding would require immediate mitigation before launch?

---

## 11. Evidence appendix

```csharp
public Task<OrderRecord?> GetOrderAsync(Guid orderId, TenantContext tenant)
{
    return _db.QuerySingleOrDefaultAsync<OrderRecord>(
        "SELECT * FROM Orders WHERE OrderId = @orderId AND TenantId = @tenantId",
        new { orderId, tenantId = tenant.TenantId });
}

public Task<IReadOnlyList<OrderRecord>> SearchOrdersForSupportAsync(string searchText)
{
    return _db.QueryAsync<OrderRecord>(
        "SELECT TOP 100 * FROM Orders WHERE SearchText LIKE @search",
        new { search = $"%{searchText}%" });
}
```

```json
{
  "jobType": "GenerateAuditExport",
  "tenantId": "tenant_acme_demo",
  "requestedBy": "user_8812",
  "exportScope": "last-90-days",
  "attempt": 1
}
```

Support manager approval is recorded in team chat. The application audit log records impersonation start/end and actions. Audit export download links expire after 7 days.

---

## 12. Participant scoring prompts

Use these during or after review:

1. Which finding would you not have written yourself in a first pass?
2. Which finding is wrong, unsupported, or overclaimed?
3. Which finding would change approval conditions, remediation priority, or launch readiness?
4. Where is the evidence trail stronger than a raw frontier-AI review?
5. Would you reuse this for a second review cycle?


---

# Evaluator Answer Key — Do Not Include in Participant Packet

## Intended review traps

1. **Support search query lacks TenantId filter** — Severity: Critical/High. Dimension: Tenant isolation. Evidence: SearchOrdersForSupportAsync has no TenantId predicate.
2. **Support impersonation lacks system/customer approval** — Severity: High. Dimension: Access governance. Evidence: approval is chat-only.
3. **Migration tool elevated permissions with manual rollback** — Severity: Medium/High. Dimension: Migration safety. Evidence: migration operator has elevated DB permissions and backup restore rollback.
4. **Async billing exactly-once/reconciliation unresolved** — Severity: Medium/High. Dimension: Financial correctness. Evidence: ADR says reconciliation needed.
5. **Audit export link protection limited** — Severity: Medium. Dimension: Data protection. Evidence: 7-day links; IP/customer restrictions unresolved.
6. **No noisy-neighbor controls** — Severity: Medium. Dimension: Reliability. Evidence: scaling notes.
7. **Application-layer tenant filtering requires proof** — Severity: High. Dimension: Governance/testing. Evidence: ADR acknowledges strong proof needed.

## Scoring guidance

Strong ArchLucid output should:

- Separate supported findings from plausible but unsupported concerns.
- Cite specific packet evidence.
- Avoid inventing infrastructure not present in the packet.
- Identify at least one non-obvious cross-boundary issue.
- Convert findings into decision-impact language.

Red flags:

- Hallucinated services or controls.
- Generic cloud best-practice findings without packet evidence.
- Critical claims without evidence.
- Missing the highest-severity injected trap.
