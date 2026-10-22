# Requirements Brief: Emergency Shelter Coordination Platform

## 1. Purpose

The fictional Coastal Response Coalition coordinates emergency shelters across six counties during hurricanes, wildfires, and winter storms. It needs a shared platform for shelter capacity, supply requests, staff deployment, and public status feeds.

The platform must remain useful during abrupt demand surges and degraded communications. It handles sensitive information about vulnerable people but is not a medical-record system.

## 2. Scope

**In scope:** shelter roster and capacity, bed and accessibility availability, supply requests, volunteer/staff shifts, county coordination dashboard, map view, public status API, incident timeline, and after-action reporting.

**Out of scope:** 911 dispatch, law-enforcement case management, clinical care, and direct public-to-public messaging.

## 3. Users and journeys

- Shelter manager reports occupancy, capacity, urgent supplies, and operational status from a phone or laptop.
- County coordinator prioritizes supplies and staff across shelters during an incident.
- Public website displays shelter location, open/closed status, pet policy, accessibility features, and capacity category without exposing resident information.
- State coordinator sees aggregated cross-county status and an auditable incident timeline.

## 4. Functional requirements

| ID | Priority | Requirement |
|---|---:|---|
| FR-01 | P0 | Create and activate an incident with defined jurisdictions, roles, and public-information approval workflow. |
| FR-02 | P0 | Allow shelter managers to update capacity and urgent needs using a mobile-friendly workflow with offline draft capability. |
| FR-03 | P0 | Publish approved public status changes within 5 minutes and retain the source and approval record. |
| FR-04 | P0 | Exchange selected resource requests with the state emergency-management system through a documented API. |
| FR-05 | P1 | Provide geospatial search for shelters and supply routes while enforcing role and jurisdiction boundaries. |
| FR-06 | P1 | Produce after-action reports with a timestamped timeline of material decisions, requests, approvals, and outcomes. |

## 5. Quality attributes and constraints

| Area | Mandatory requirement |
|---|---|
| Surge | Handle a 100× traffic increase for 48 hours with no manual infrastructure changes required during the incident. |
| Availability | Public-status service target: 99.95% monthly. Authorized coordination functions target: 99.9% monthly. |
| Degraded mode | If a shelter loses connectivity, it must be able to prepare updates locally and reconcile them with conflict visibility on reconnection. |
| Privacy | Do not expose resident identity, medical needs, contact information, or exact occupancy counts publicly. Collect only the minimum personal data needed for staff coordination. |
| Security | Enforce MFA for government and shelter-manager accounts; use role and county/jurisdiction scope. Emergency break-glass access must be time-bound, justified, and audited. |
| Performance | 95% of public API reads under 500 ms under surge. Authorized dashboard updates under 3 seconds under normal load. |
| Audit | Preserve incident configuration, approvals, public posts, access changes, and data corrections for 10 years. |
| Accessibility | Public and authorized interfaces must meet WCAG 2.2 AA. |
| Interoperability | State-system exchange requires schema validation, idempotency, retry handling, and operator-visible failures. |
| Operations | Include synthetic availability checks for public status, data freshness indicators, backlog alerts, and a tested incident-mode runbook. |

## 6. Known facts

- Six counties normally manage 220 shelters; a major hurricane may activate 1,500 shelters.
- Public traffic during a major event can reach 25,000 requests/second.
- Some rural shelters rely on cellular connectivity with intermittent service.
- Geographic data comes from a state GIS service with a daily bulk update and an uncertain emergency update channel.
- A public post requires approval by a county public-information officer, except in a declared life-safety emergency.

## 7. Decisions required / incomplete evidence

- The exact legal retention schedule for staff contact data is not defined.
- The conditions for life-safety publication override need formal approval.
- It is unknown whether the state system can accept outbound updates during a regional event.
- The primary and backup public cloud regions have not been selected.

## 8. Architecture deliverables requested

Generate a multi-jurisdiction architecture with a separate public delivery path, coordination path, GIS integration, external state-system boundary, resilient offline update flow, and incident operations plane. Explain how public transparency, privacy, approval workflow, and surge handling coexist. Mark each unresolved issue as a decision or an assumption, not a settled fact.
