> **Scope:** ADR 0063 — Cross-review finding identity — design record for stable finding correlation across reviews.

# ADR 0063: Cross-review finding identity

- **Status:** Accepted
- **Date:** 2026-08-04
- **Deciders:** Owner / platform engineering
- **Related:** [ADR 0039](0039-commit-sealed-evidence-immutability.md), [ADR 0045](0045-committed-run-header-immutability.md), [ADR 0062](0062-finding-verification-loop.md), [`FINDING_PROVENANCE.md`](../../library/customer-facing/FINDING_PROVENANCE.md)

## Context

Operators compare two finalized reviews, replay runs, and export sponsor artifacts. Findings must correlate across those surfaces without implying that identity equals immutability of severity or disposition — only that the platform can recognize the same logical observation when policy rule ids, fingerprints, or stable finding ids align.

## Decision

1. **Primary key:** `findingId` is unique within a committed run and never reused across runs.
2. **Cross-run correlation:** comparison and delta surfaces use `{policyRuleId}:{normalizedFindingFingerprint}` when both sides expose a policy rule; otherwise they fall back to normalized message/category fingerprinting with explicit "possible match" labeling in UI.
3. **Trust labels travel with findings:** `trustLabel` and `trustLabelReason` are authoritative on run detail and exports; UI must not re-infer origin when wire labels are present.
4. **No silent merge:** governance disposition on one run does not auto-apply to another run's finding with a matching fingerprint.

## Consequences

- Run detail query enriches findings with trust labels at read time via `FindingTrustLabelEnricher`.
- UI provenance modules prefer wire `trustLabel` before heuristic inference.
- Comparison exports document correlation method in metadata; they do not claim deterministic identity when only fuzzy fingerprints match.

## Engineering backlog (round 3 — 2026-08-04)

| ID | Title |
| --- | --- |
| **TB-2042** | Cross-review finding fingerprint correlation service |
| **TB-2043** | Comparison export metadata — correlation method honesty |
| **TB-2044** | Trust labels on all finding export paths |

Authoritative tracking: [`docs/library/TECH_BACKLOG_OPEN.md`](../../library/TECH_BACKLOG_OPEN.md) § TB-2042–TB-2047.
