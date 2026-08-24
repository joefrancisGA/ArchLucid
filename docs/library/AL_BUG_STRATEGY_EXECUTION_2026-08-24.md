# `/al-bug` strategy execution — 2026-08-24

## Outcome

The evidence-guided strategy produced **five confirmed defects from five targeted hunts**:

| Zone | Confirmed defect | Regression evidence |
| --- | --- | --- |
| `notifications-pipeline` | Digest Slack/Teams subscriptions accepted unsafe webhook destinations without the shared SSRF policy. | Unsafe HTTP/loopback destinations rejected; policy suite passed. |
| `identity-provider-config` | Identity activation accepted non-HTTP(S) issuer URIs such as `file:` and `javascript:`. | 12 focused tests passed. |
| `ui-operator-lib` | Live string `humanReviewStatus` values were discarded, hiding review badges. | 35 focused Vitest cases and ESLint passed. |
| `archlucid-contracts` | One-based contract `AgentType.Topology` became zero-based generated `Cost` in the CLI bridge. | Four enum variants passed `SubmitAgentResultAsync_writes_contract_agent_type_name`. |
| `application-governance-policy` | Synthetic pre-commit simulation reported missing or foreign scoped runs as allowed. | 22 `PreCommitGovernanceGateTests` passed. |

This is direct evidence that source-backed hypothesis generation, not repeated empty-ledger selection, is the limiting factor.

## Changes to the hunt system

1. The picker now returns `seedHunt: true` whenever an eligible zone has no open hypotheses, including previously productive zones.
2. The canonical workflow forbids recording a mechanical dry hunt for an empty hypothesis list.
3. `al-bug-evidence-report.py` combines:
   - empty zones requiring reseed;
   - focused Cobertura branch gaps;
   - surviving Stryker mutants;
   - recent production churn without matching test filenames;
   - changed production files outside the current zone catalog.
4. The ledger contains fresh hypotheses across sibling validation, serialization, enum, UTC/time, cancellation, retry, and export-integrity mechanisms.
5. Three catalog gaps were added as first-class zones:
   - `quick-scan-distributed-concurrency`;
   - `run-execute-ownership`;
   - `chatops-delivery`.

## Coverage and mutation evidence

- Removing the stale `ExcludeFromCodeCoverage` attribute from `DraftNewCommand` made the class measurable.
- Focused coverage: **10/10 tests passed**; the file contains class segments as low as **20.4% line / 35.0% branch coverage**.
- Focused Stryker run: **88 tested mutants**, **56 killed**, **27 survived**, **5 timed out**, mutation score **36.97%**.
- Surviving logical mutants directly seeded four response-state hypotheses in `cli-draft-new`.
- The machine-readable rankings are in [`AL_BUG_HUNT_EVIDENCE_2026-08-24.md`](AL_BUG_HUNT_EVIDENCE_2026-08-24.md).

## Operational trade-offs

- **Security:** sibling validation and SSRF hypotheses receive priority because one missing guard can cross trust boundaries.
- **Scalability:** coverage and mutation runs are scoped by zone; full-solution mutation is too CPU-expensive for every hunt.
- **Reliability:** cancellation, lease release, retry/idempotency, UTC/time, and concurrency are mandatory mechanism rotations.
- **Cost:** the report uses repository-local git/Cobertura/Stryker data and no paid service; mutation is CPU-heavy, so it is targeted at high-yield files.

## Required next-run behavior

For every selected zone:

1. Read the source and existing tests.
2. Generate mechanism-backed hypotheses from at least three evidence lenses.
3. Prove a failure before editing production code.
4. Record `dry` only after testing actual hunt-ready hypotheses.
5. Record `seed-only` when a fresh read finds no plausible untested mechanism.
6. Use `-Nominate` when the implicated path is outside every catalog zone.
