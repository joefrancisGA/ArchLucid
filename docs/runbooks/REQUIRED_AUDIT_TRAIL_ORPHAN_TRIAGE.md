> **Scope:** Operator triage when Required governance/finalize domain rows lack matching durable audit events, or when Required audit writes are abandoned after fail-closed retries.

# Required audit trail orphan triage (TB-955 / INV-003)

**Audience:** On-call / platform operators investigating `archlucid_required_audit_*` signals.

**Related:** [`ARCHITECTURE_INVARIANTS.md`](../library/ARCHITECTURE_INVARIANTS.md) INV-003, [`OBSERVABILITY.md`](../library/OBSERVABILITY.md), `RequiredAuditEventTypes`, `DurableAuditLogRetry.LogOrThrowAsync` (TB-953).

---

## Signals

| Metric | Meaning |
| --- | --- |
| `archlucid_required_audit_write_abandons_total` | Fail-closed Required write abandoned after retries (**LogOrThrow** only — not informational `TryLogAsync`) |
| `archlucid_required_audit_trail_orphans_detected_total` | Periodic probe counted domain rows missing expected Required audit events (label `domain`) |
| `archlucid_required_audit_trail_orphan_alerts_total` | Pageable-equivalent increment when orphan count &gt; 0 for a domain slice |

Prometheus alerts: `ArchLucidRequiredAuditWriteAbandon`, `ArchLucidRequiredAuditTrailOrphans` in [`infra/prometheus/archlucid-alerts.yml`](../../infra/prometheus/archlucid-alerts.yml).

Hosted probe / job: `required-audit-trail-orphan-probe` (`RequiredAuditTrail:*` options).

---

## Domains probed

| `domain` label | Domain row | Expected audit `EventType` |
| --- | --- | --- |
| `governance_approved` | `GovernanceApprovalRequests` Status=`Approved` | `GovernanceApprovalApproved` |
| `governance_rejected` | `GovernanceApprovalRequests` Status=`Rejected` | `GovernanceApprovalRejected` |
| `golden_manifest_finalized` | `GoldenManifests` (not archived) | `ManifestFinalized` |

Grace window (default **15 minutes**) avoids dual-write lag false positives. Lookback defaults to **7 days**.

---

## First response

1. Confirm the alert is **Required** path noise, not informational soft-fail (`archlucid_audit_write_failures_total` alone may include TB-001 telemetry).
2. For abandon spikes: check SQL connectivity / `AuditEvents` insert errors around the timestamp; correlate with HTTP 500s on approve/finalize/identity paths.
3. For orphan counts: sample domain ids (approval request id / manifest id) and check whether `dbo.AuditEvents` has the expected `EventType` for that tenant.
4. Do **not** “backfill” by mutating sealed evidence. Prefer documenting the gap, fixing the write path, and opening a follow-up if historical repair is required.
5. Informational paths (`TryLogAsync`, cost/projection/funnel) are **out of scope** — do not page on those.

---

## Configuration

| Key | Default | Notes |
| --- | --- | --- |
| `RequiredAuditTrail:OrphanProbeEnabled` | `true` | Disable only for break-glass |
| `RequiredAuditTrail:OrphanProbeIntervalMinutes` | `60` | Clamped 5–1440 |
| `RequiredAuditTrail:OrphanProbeGraceMinutes` | `15` | Dual-write lag grace |
| `RequiredAuditTrail:OrphanProbeLookbackDays` | `7` | Scan bound |

Offload: `Jobs:OffloadedToContainerJobs` entry `required-audit-trail-orphan-probe` (same pattern as `orphan-probe`).
