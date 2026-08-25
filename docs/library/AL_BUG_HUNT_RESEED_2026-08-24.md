# Ledger reseed pass — 2026-08-24

## Cleanup

Reverted mechanical damage from the 200-iteration batch stress test:

- Restored `docs/library/AL_BUG_HUNT_LEDGER.md` from commit `ec89adfc80` (pre-batch hunt counts and hypothesis tags).
- Restored `docs/library/AL_BUG_HUNT_RUN_LOG.jsonl` from the same commit (removed 203 synthetic batch entries).

## Reseed

Evidence report: `docs/library/AL_BUG_HUNT_EVIDENCE_2026-08-24-reseed.md` (churn + empty-zone scan; no Cobertura/Stryker artifacts in this pass).

Inserted **36 hunt-ready hypotheses** across **13 high-yield zones** via `scripts/agent/al-bug-reseed-ledger.py` after source reads:

| Zone | New hunt-ready rows |
| --- | --- |
| topology-proposal-merge | 3 |
| arm-terraform-source-ids | 3 |
| auth-return-path | 3 |
| email-otp-auth | 3 |
| commit-output-integrity | 3 |
| storage-vs-data-category | 3 |
| tenant-erasure | 3 |
| finding-inspect-sql | 3 |
| orchestrator-transient-retry | 3 |
| outbound-webhook-dry-run | 3 |
| technology-ledger-merge | 2 |
| tenant-settings-sql | 2 |
| llm-wallet | 2 |

**Open hunt-ready total after reseed:** 53 (was 10 after batch, 17 before batch).

**Still empty:** 52 zones — next pass should use Cobertura + scoped Stryker on `DraftNewCommand`, topology merge, and contracts paths.

## Next hunts

Run individual `/al-bug` (not batch loop) on picker top zones. Expect highest yield from zones with dual-path disagreement hypotheses (gate vs merge, SQL vs mapper, middleware vs service).
