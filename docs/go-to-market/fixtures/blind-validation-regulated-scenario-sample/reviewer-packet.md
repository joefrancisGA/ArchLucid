> **Reviewed:** 2026-07-25

# Blind insight validation — reviewer packet

**Packet label:** Synthetic regulated healthcare data platform (demo-safe)
**Evidence basis:** demo-derived · **Execution mode (ArchLucid path):** simulator

Clinical APIs, PHI-classified storage, private endpoints, and audit logging on a demo healthcare workload. No production PHI.

> Reviewer sees **Arm A** and **Arm B** only. Source mapping is in `source-key.json` (facilitator only).

## Arm A

Material findings: **5**

### A-F01 · High · Compliance

Encrypt PHI at rest — Use encryption for protected health information in storage accounts and databases.

### A-F02 · Medium · Topology

Prefer private connectivity — Consider private endpoints for SQL and blob access instead of public endpoints.

### A-F03 · Medium · Compliance

Enable audit logging — Turn on diagnostic logs for administrative and data-plane activity.

### A-F04 · Medium · Reliability

Document disaster recovery — Add DR runbooks and backup retention expectations for clinical workloads.

### A-F05 · Low · Security

Review network security groups — Validate NSG rules restrict inbound traffic to required ports only.

## Arm B

Material findings: **5**

### B-F01 · High · Compliance

PHI encryption boundary — Patient indexes and imaging metadata use customer-managed keys in Key Vault with explicit PHI classification on every blob container.

### B-F02 · High · Topology

Private data paths — Clinical APIs resolve storage and SQL through private endpoints; public network access remains denied on data stores.

### B-F03 · Medium · Compliance

Audit coverage — Diagnostic settings stream administrative actions and data-plane queries into immutable Log Analytics workspaces.

### B-F04 · Medium · Reliability

Regional failover documentation gap — Multi-region standby is described at the service level but RPO/RTO targets for clinical read paths are not attached to the manifest governance block.

### B-F05 · Low · Cost

Idle analytics pool window — Dedicated SQL pool runs nightly ETL but remains provisioned through weekends without pause-resume automation.

## Scoring

Complete `scoring-sheet.json` using 1–5 scales:

- **novelty** — 1 = obvious to any architect · 5 = non-obvious and valuable
- **correctnessConfidence** — 1 = likely wrong vs packet · 5 = high confidence correct
- **actionability** — 1 = vague · 5 = clear sponsor/team next step
- **surpriseFactor** — 1 = expected in first pass · 5 = would not have written unprompted
- **decisionImpact** — 1 = informational only · 5 = would change approval or priority

Optional single-letter **classification** per finding: O / U / N / X / S.

**Guardrail:** Demo-derived fixtures illustrate protocol shape only — not buyer proof.
