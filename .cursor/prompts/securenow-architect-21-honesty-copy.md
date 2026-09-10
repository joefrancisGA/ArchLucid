# SA-21 — Honesty copy and architect sentence template

**Do not** display confidence percentages. Follow [`.cursor/prompts/securenow-architect-00-index.md`](securenow-architect-00-index.md) global constraints.

## Goal

Product copy (API `explanationTemplate`, factory/path UI, optional help slug) uses the architect sentence:

“This configuration creates a path from actor A through identity B and network path C to asset D. The path exists because controls E and F compose poorly. Change G will break the path with minimal operational risk. Verify using H.”

Fill from path slots; omit missing slots rather than inventing. Bands shown as words. Capability-to-flow uses “may access / may reach.”

## Why

Scanner copy (“violates control X”) trains the wrong product. False precision (“82%”) is indefensible.

## Context

- Plane §§6, 11
- SA-04 DTO slots; SA-16 UI
- SecureNow vs ArchLucid display rules (SN-01)
- Help: do not steal `/governance` Approval copy (SH-07)

## What to build

1. Deterministic template builder in Application (unit-tested) consumed by API and UI.
2. UI: band chip/text from `PathConfidenceBand`; weakest-hop sentence.
3. Deny-list tests: `%` confidence, `exfiltrated`, `compliant` as auditor conclusion, `apply to Azure`.
4. Optional `/help` slug `security-evidence-paths` for Security shell only.

## Acceptance criteria

- Architecture `:3000` review findings copy unchanged.
- Empty network slot: sentence still grammatical (“through identity B to asset D”).

## Constraints

- No new risk score UI that looks like a CVSS gauge.
- Vitest + Application tests for the template.

## Done when

The lecture’s closing distinction is what the desk actually says.
