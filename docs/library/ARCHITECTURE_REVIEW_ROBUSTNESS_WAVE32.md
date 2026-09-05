> **Scope:** Contributor-reference — wave-32 robustness controls for architecture create and review (branch `cursor/wave32-robustness-e14f`).

# Architecture create/review robustness — wave 32

Companion to [`ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE31.md`](ARCHITECTURE_REVIEW_ROBUSTNESS_WAVE31.md) (378 emitter call sites deferred from wave 31).

| # | Control | Primary wiring |
|---|---------|----------------|
| 378 | Compliance-drift escalation scanner/publisher job wiring | `ComplianceDriftEscalationScanner`, `ComplianceDriftEscalationHostedService`, `ComplianceDriftEscalationArchLucidJob`, `ComplianceDriftIntegrationEventPublishing` |

Guard tests: `ArchLucid.Architecture.Tests/ArchitectureReviewRobustnessWave32ArchitectureTests.cs`.

**Hasher baseline note:** wave 32 does not bump Hasher A schema version; export gates, compare fingerprints, and finding read/write sync remain on the existing **`v12`** baseline (`tests/manifest-hash/hasher-baseline-v12.json`).

**Configuration:** `ComplianceDriftEscalation:Enabled`, `ScanIntervalHours`, optional `OpenFindingsCountThreshold`, optional `PolicyPackStaleHoursThreshold` (default 72).

**Deferred:** wave 29 outbox metadata stretch (339–344) and infra-evidence cross-plane batch (345–350) remain for a follow-up wave when those rows are scheduled.
