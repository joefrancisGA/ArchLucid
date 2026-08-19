> **Reviewed:** 2026-07-26

# Architecture Review Packet: Healthcare Claims Intake Modernization

**Classification:** Sanitized synthetic packet for principal architect evaluation  
**Domain:** Healthcare claims intake / PHI handling / adjudication handoff  
**Length target:** 8–15 page review-session packet  
**Use:** Participant raw material for ArchLucid principal-architect insight validation

---

## 1. Business context

Northstar Health Benefits is modernizing claims intake from fax, email, SFTP, and manual entry into a governed claims intake API and document-upload workflow. The first pilot covers two internal operations teams and one approved clearinghouse partner. The sponsor wants faster intake, stronger auditability, fewer duplicate handoffs, and an architecture package before pilot launch.

The packet is intentionally realistic rather than polished. It includes open questions, scope deferrals, cross-boundary assumptions, and implementation notes that may or may not be acceptable depending on risk tolerance.

---

## 2. System overview

| Component | Description |
|---|---|
| Claims Intake API | REST API for claim metadata and submission status |
| Document Upload Service | Handles PDFs, scanned forms, and supporting documents |
| FHIR Validation Worker | Validates selected fields against FHIR-aligned rules |
| Claim Intake Database | Stores claim metadata, status, validation outcomes |
| Document Storage | Stores uploaded and normalized documents |
| Adjudication Handoff Queue | Sends accepted claims downstream |
| Operations Portal | Internal UI for monitoring and corrections |
| Audit Event Store | Records submission, validation, handoff, and access events |

---

## 3. User types and trust boundaries

| Actor | Trust origin | Interaction |
|---|---|---|
| Internal operations user | Internal trusted staff | Interactive UI |
| Clearinghouse submitter | External partner | API/batch submission |
| FHIR validation worker | Internal service | Async processing |
| Adjudication consumer | Internal downstream system | Queue consumer |
| Support analyst | Internal support | Portal and logs |
| Compliance reviewer | Internal governance | Audit export |

Reviewers should pay special attention to where data, identity, operational responsibility, and auditability cross boundaries.

---

## 4. Main request and data flows

1. Claim metadata submission writes intake row, emits audit event, and returns claim intake ID.
2. Document upload stores supporting files in Blob Storage and references them from claim metadata.
3. FHIR validation worker validates selected fields and marks claims accepted, rejected, or manual-review-needed.
4. Accepted claims are sent to the adjudication queue; failed messages may be retried.
5. Support analysts search by claim intake ID, external reference ID, and submitter ID.

---

## 5. Data classification and retention

| Data category | Classification | Retention |
|---|---|---|
| Claim metadata | PHI / restricted | 7 years |
| Supporting documents | PHI / restricted | 7 years |
| Validation results | Internal restricted | 7 years |
| Handoff messages | PHI-adjacent | 90 days active then archive |
| Application logs | Operational | 30 days hot, 1 year archive |
| Audit events | Compliance evidence | 7 years |

---

## 6. Security and identity model

- Internal users authenticate through Entra ID.
- Clearinghouse identity is not finalized; options include certificates, API keys behind private connectivity, or federated identity.
- Support Analyst and Intake Operator use the same portal; the UI hides fields based on role.
- Application-level authorization is expected to enforce row/team-level restrictions.
- Field-level encryption is under discussion but not in the pilot estimate.
- Document encryption relies on platform storage encryption by default.

---

## 7. Reliability, resiliency, and performance

- Intake API availability target is 99.9% for pilot.
- RPO for claim metadata is 15 minutes; RTO is 4 hours.
- Peak load is 25,000 claims/day; document upload peak is 300 GB/day.
- Queue retry window is 72 hours.
- Downstream adjudication consumers may be offline during maintenance windows.

---

## 8. Operational model

The operating team intends to use standard CI/CD deployment with environment-specific configuration, centralized logs, metrics, and alerting. Some business operations are business-hours only, while the technical platform has after-hours escalation for critical incidents. Reviewers should examine whether the stated operational model is sufficient for the stated business goals, data sensitivity, and pilot commitments.

---

## 9. Architecture decisions / ADRs

### ADR-001: Use Azure SQL for claim metadata

**Decision/rationale:** Relational state transitions and operational reporting familiarity.

### ADR-002: Use Blob Storage for supporting documents

**Decision/rationale:** Durability and lifecycle management for variable-size documents.

### ADR-003: Use Service Bus for adjudication handoff

**Decision/rationale:** Decouple intake from downstream availability.

### ADR-004: Defer partner identity model

**Decision/rationale:** Reduce pilot scope; accept rework risk.

### ADR-005: Use application role checks for support filtering

**Decision/rationale:** Faster than field-level protection in pilot.

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

```hcl
resource "azurerm_storage_account" "claims_docs" {
  name                     = "stclaimsdocspilot001"
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"
  blob_properties {
    delete_retention_policy { days = 30 }
    container_delete_retention_policy { days = 30 }
  }
}
```

```json
{
  "roles": {
    "IntakeOperator": ["claim.submit", "claim.correct.assigned", "claim.view.summary"],
    "SupportAnalyst": ["claim.search", "claim.view.history", "claim.view.document.link"],
    "ComplianceReviewer": ["audit.export", "claim.view.sample"]
  },
  "fieldFiltering": "ui-only-v1"
}
```

```json
{
  "messageType": "ClaimAcceptedForAdjudication",
  "claimIntakeId": "ci_2026_000142",
  "externalReferenceId": "partner-ref-778812",
  "memberReference": "member-opaque-4431",
  "serviceDate": "2026-05-17",
  "documentIds": ["doc_10092", "doc_10093"],
  "attempt": 1
}
```

Operational note: manual replay republishes the original handoff message with a new queue message ID.

---

## 12. Participant scoring prompts

Use these during or after review:

1. Which finding would you not have written yourself in a first pass?
2. Which finding is wrong, unsupported, or overclaimed?
3. Which finding would change approval conditions, remediation priority, or launch readiness?
4. Where is the evidence trail stronger than a raw frontier-AI review?
5. Would you reuse this for a second review cycle?
