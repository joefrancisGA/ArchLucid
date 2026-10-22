# Requirements Brief: Clinical Referral Exchange

## 1. Purpose and decision context

Northstar Health Network operates twelve outpatient clinics and two imaging centers. It needs a new system to receive referrals from electronic health record (EHR) systems, route them to the appropriate service line, track patient outreach, and return referral status to the originating EHR.

This is a production workload. The architecture must be appropriate for U.S. healthcare data and must support evidence-backed review of security, availability, integration, and operational decisions.

## 2. Scope

**In scope**

- Referral intake from up to three EHR vendors using HL7 FHIR R4 APIs and, where unavoidable, HL7 v2 messages.
- Referral normalization, duplicate detection, work queues, patient outreach status, appointment outcome, and status updates to the source EHR.
- A browser application for 350 care coordinators, 25 supervisors, and 15 integration administrators.
- Audit search and export for compliance staff.

**Out of scope**

- Clinical diagnosis or treatment recommendations.
- Replacing the EHR, scheduling system, or imaging information system.
- Patient-facing mobile applications in the first release.

## 3. Users and key journeys

1. An EHR submits a referral; the coordinator sees a usable work item within 60 seconds.
2. A coordinator verifies insurance and contacts the patient; each material status change is recorded with actor, time, and source.
3. A supervisor reallocates unworked referrals and sees aging by service line and clinic.
4. The system returns an accepted, scheduled, completed, or unable-to-contact status to the source EHR.
5. An auditor reconstructs the referral lifecycle without accessing unrelated patients.

## 4. Functional requirements

| ID | Priority | Requirement | Acceptance measure |
|---|---:|---|---|
| FR-01 | P0 | Validate incoming payloads against supported FHIR profiles before creating work. | Invalid items are rejected with an actionable response and retained in a quarantine record. |
| FR-02 | P0 | Prevent duplicate active referrals for the same patient, service, and requested time window. | Duplicate logic is explainable and supports a supervisor override with rationale. |
| FR-03 | P0 | Assign referrals by service line, clinic, insurance constraint, and coordinator capacity. | Assignment decision and inputs are auditable. |
| FR-04 | P0 | Send status updates reliably to the originating EHR. | Delivery is idempotent, retried, and visible to operators. |
| FR-05 | P1 | Provide configurable escalation rules for referrals approaching a service-level target. | A supervisor can see why an escalation occurred. |
| FR-06 | P1 | Support manual referral entry only for documented downtime. | Entry requires source, reason, and reconciliation status. |

## 5. Quality attributes and constraints

| Area | Mandatory requirement |
|---|---|
| Privacy | Data contains PHI. Encrypt in transit and at rest; enforce least privilege; prohibit production PHI in logs, traces, analytics, and lower environments. |
| Identity | Workforce users authenticate through the existing enterprise identity provider with MFA. No shared accounts. Service-to-service access uses workload identity, not static secrets. |
| Availability | 99.95% monthly availability for intake and work queues, excluding announced maintenance. A regional outage must not lose accepted referrals. |
| Recovery | RPO ≤ 5 minutes for accepted referrals; RTO ≤ 4 hours for a regional service failure. |
| Performance | 95% of valid inbound referrals visible in the queue within 60 seconds. Coordinator screens must load primary queue data within 3 seconds at 350 concurrent users. |
| Audit | Retain immutable, searchable records of access, referral state changes, outbound deliveries, overrides, and configuration changes for 7 years. |
| Interoperability | FHIR API clients authenticate using standards-based OAuth 2.0 patterns. External payloads are treated as untrusted input. |
| Operations | Operators need a dashboard for ingestion backlog, failed deliveries, duplicate rate, queue aging, and integration latency. |
| Cost | The first-year platform run-rate target is $18,000/month or less, excluding vendor EHR transaction fees. |

## 6. Data and integration facts

- Initial volume: 35,000 referrals/month; forecasted 20% annual growth.
- Peak intake occurs Monday 08:00–11:00 local time at up to 35 referrals/second for ten minutes.
- The authoritative patient identity remains in the source EHR; this system stores the minimum necessary operational copy.
- One EHR delivers duplicate messages and may replay a day's messages after an outage.
- A legacy scheduling system exposes a REST API but cannot guarantee webhooks.

## 7. Decisions required / incomplete evidence

- Whether cross-region active-active processing is justified by the availability target and cost cap.
- Whether patient contact notes are retained in this system or linked to the EHR only.
- Exact FHIR profiles and conformance-testing responsibilities for each EHR vendor.
- Whether all clinics may use the same data-residency region. Current assumption: U.S. only.

## 8. Architecture deliverables requested

Produce a logical component diagram and data-flow diagram, including EHR trust boundaries, integration quarantine, work management, audit store, operations plane, and outbound delivery path. Trace every mandatory quality requirement to decisions, controls, evidence, and validation tests. Identify any recommendation that cannot be verified from this brief.
