> **Reviewed:** 2026-07-26

# Architecture Review Packet: Manufacturing IoT Edge Telemetry Platform

**Classification:** Sanitized synthetic packet for principal architect evaluation  
**Domain:** Manufacturing / IoT / OT-adjacent telemetry  
**Length target:** 8–15 page review-session packet  
**Use:** Participant raw material for ArchLucid principal-architect insight validation

---

## 1. Business context

HelioWorks Manufacturing wants near-real-time visibility into machine health, throughput, and quality signals across five plants. The first pilot covers one plant and three production lines using edge gateways, local buffering, cloud ingestion, time-series storage, alerting, dashboards, and firmware updates.

The packet is intentionally realistic rather than polished. It includes open questions, scope deferrals, cross-boundary assumptions, and implementation notes that may or may not be acceptable depending on risk tolerance.

---

## 2. System overview

| Component | Description |
|---|---|
| Edge Gateway | Collects telemetry from PLC/SCADA-adjacent sources |
| Local Buffer | Stores events during cloud outage |
| Cloud Ingestion API | Receives telemetry batches |
| Device Registry | Tracks gateway identity/certificate status |
| Time-Series Store | Stores telemetry and metrics |
| Alerting Service | Detects anomalies and thresholds |
| Dashboard | Plant and sponsor views |
| Firmware Update Service | Publishes update manifests/artifacts |

---

## 3. User types and trust boundaries

| Actor | Trust origin | Interaction |
|---|---|---|
| Edge gateway | Plant network/device identity | Telemetry upload |
| Plant operator | Plant network | Dashboard/local status |
| Cloud ingestion service | Cloud trusted | API ingestion |
| Maintenance engineer | Internal | Alert review |
| Platform engineer | Internal | Registry/deployment |
| Firmware publisher | Internal build system | Signed releases |

Reviewers should pay special attention to where data, identity, operational responsibility, and auditability cross boundaries.

---

## 4. Main request and data flows

1. Gateway polls sources every 10 seconds, normalizes batches, writes local buffer, uploads to cloud.
2. Offline buffering retains up to 24 hours, then drops oldest events when full.
3. Cloud alerting computes anomalies and sends critical maintenance alerts.
4. Gateways pull signed firmware update manifests daily from cloud storage.

---

## 5. Data classification and retention

| Data category | Classification | Retention |
|---|---|---|
| Raw telemetry | Operational sensitive | 1 year |
| Derived metrics | Business sensitive | 3 years |
| Alert history | Operational | 2 years |
| Gateway config | Security sensitive | Active + 1 year |
| Firmware artifacts | Security sensitive | 5 versions |
| Audit events | Security/compliance | 7 years |

---

## 6. Security and identity model

- Each gateway uses a device certificate provisioned during installation.
- Certificate rotation is planned annually.
- Emergency revocation is manual through device registry.
- Plant operators access local status page from plant network.
- Local status page does not require authentication in pilot.
- Firmware artifacts are signed, but manifest access uses a storage SAS token.
- SAS token lifetime is currently 180 days.

---

## 7. Reliability, resiliency, and performance

- Anomaly detection within 5 minutes during normal connectivity.
- Gateway continues collection during cloud outage.
- Local buffer stores 24 hours; if full, oldest events are dropped.
- No inbound cloud-to-plant connections.
- Alerting is cloud-only.
- Plant operators can view local gateway status but not full anomaly logic.

---

## 8. Operational model

The operating team intends to use standard CI/CD deployment with environment-specific configuration, centralized logs, metrics, and alerting. Some business operations are business-hours only, while the technical platform has after-hours escalation for critical incidents. Reviewers should examine whether the stated operational model is sufficient for the stated business goals, data sensitivity, and pilot commitments.

---

## 9. Architecture decisions / ADRs

### ADR-001: Use edge buffering

**Decision/rationale:** Handle unreliable plant connectivity.

### ADR-002: Cloud-only anomaly detection

**Decision/rationale:** Faster iteration; alerts depend on cloud connectivity.

### ADR-003: Pull-based firmware updates

**Decision/rationale:** Avoid inbound cloud-to-plant access.

### ADR-004: Network-restricted local status page

**Decision/rationale:** Simplify plant-floor usability.

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

```yaml
gatewayId: plant1-line3-gw02
pollIntervalSeconds: 10
localBuffer:
  engine: sqlite
  maxRetentionHours: 24
  maxDiskPercent: 75
  overflowPolicy: drop_oldest
cloudUpload:
  batchSize: 500
  retryBackoffSeconds: [5, 30, 120, 600]
firmware:
  manifestUrl: https://storage.example.invalid/fw/manifest.json?sas=...
  checkIntervalHours: 24
```

Certificates are issued during gateway installation. Annual rotation is planned. No automated certificate-expiration alert exists yet. The local status page shows gateway ID, line ID, last upload time, buffer depth, firmware version, and recent error messages. Machine anomaly alerts are generated only after telemetry reaches cloud ingestion.

---

## 12. Participant scoring prompts

Use these during or after review:

1. Which finding would you not have written yourself in a first pass?
2. Which finding is wrong, unsupported, or overclaimed?
3. Which finding would change approval conditions, remediation priority, or launch readiness?
4. Where is the evidence trail stronger than a raw frontier-AI review?
5. Would you reuse this for a second review cycle?
