# Requirements Brief: Multi-Tenant Supplier Compliance Portal

## 1. Purpose

Harborline Procurement wants a SaaS portal through which enterprise buyers collect and review supplier compliance artifacts: insurance certificates, security questionnaires, sanctions attestations, and approved exceptions. Buyers must never see one another's suppliers, policies, or evidence.

The first release is intended for regulated financial-services and healthcare customers in the United States and Canada.

## 2. Scope

**In scope:** tenant onboarding, workforce and supplier identity, workspace/project administration, document upload, evidence extraction, policy evaluation, review workflow, exception approval, notifications, reporting, and audit export.

**Out of scope:** contract negotiation, procurement payments, legal advice, and automated vendor disqualification.

## 3. Primary users

- Buyer administrator: configures organization-private policy packs and user access.
- Supplier respondent: uploads evidence and responds to findings only for invited workspaces.
- Reviewer: evaluates evidence and recommends approval, exception, or remediation.
- Governance officer: approves exceptions and exports the audit package.
- Platform operator: supports the service but must not access tenant content by default.

## 4. Functional requirements

| ID | Priority | Requirement |
|---|---:|---|
| FR-01 | P0 | Enforce tenant, workspace, project, artifact, and evidence scope on every read and write. |
| FR-02 | P0 | Support buyer-owned private policy packs with version, owner, rationale, effective date, and approval history. |
| FR-03 | P0 | Ingest uploaded documents, virus-scan them, extract metadata, and preserve the original immutable artifact. |
| FR-04 | P0 | Record findings as confirmed, inferred, missing, conflicting, or architecture-statement-only; do not report an unevaluated control as passing. |
| FR-05 | P0 | Support a reviewer workflow with separation of duties for exception approval. |
| FR-06 | P1 | Produce an export containing review ID, review date, selected policy-pack versions, evidence cutoff, evidence links, decisions, and unresolved items. |
| FR-07 | P1 | On rerun, prominently report new, resolved, and remaining findings against the same scope. |

## 5. Quality attributes and constraints

| Area | Mandatory requirement |
|---|---|
| Isolation | Customer content, private policies, embeddings, search indexes, logs, and exports must be logically isolated by tenant; private policy packs are never discoverable or used to train other tenants. |
| Authentication | Workforce SSO via SAML or OIDC; supplier access uses an invitation with MFA-capable identity. |
| Authorization | RBAC plus resource-scoped authorization; authorization is checked server-side, not only in the UI. |
| Data location | U.S. and Canadian customers may require designated storage regions. Cross-region replication must preserve residency policy. |
| Availability | 99.9% monthly availability; scheduled maintenance may not occur during 08:00–18:00 tenant local time without approval. |
| Recovery | RPO ≤ 15 minutes; RTO ≤ 8 hours. |
| Performance | 95% of ordinary UI requests under 2 seconds; a 100-page upload must be acknowledged within 10 seconds and may complete asynchronously. |
| Audit | Immutable audit records for authentication, authorization denials, policy changes, evidence access, findings, approvals, and exports; retain for 7 years. |
| AI assurance | AI extraction or interpretation must cite source evidence, declare confidence/limitations, tolerate abstention, and remain distinguishable from deterministic policy evaluation. |
| Operations | Provide tenant-safe observability: platform operators can diagnose service health without default access to document contents. |

## 6. Expected scale

- First year: 40 buyer tenants, 15,000 supplier organizations, 2,500 active buyer users.
- Peak: 1,000 concurrent sessions and 150 document uploads/minute.
- Typical artifact size: 8 MB; maximum accepted file: 75 MB.
- A buyer may retain evidence for seven years; legal holds are expected.

## 7. Decisions required / incomplete evidence

- Whether Canadian tenants require Canada-only processing for AI extraction, not merely storage.
- Whether tenants may bring their own encryption keys.
- The legal basis and lifecycle for deleting supplier data after a buyer relationship ends.
- Exact accessibility standard; working assumption is WCAG 2.2 AA.

## 8. Architecture deliverables requested

Create a multi-tenant reference architecture with explicit tenant and trust boundaries. Include identity, ingestion, malware handling, primary data, immutable evidence, search/retrieval, AI assurance envelope, audit/export, notifications, and operator access. List every scope-enforcement point and test that could prove it.
