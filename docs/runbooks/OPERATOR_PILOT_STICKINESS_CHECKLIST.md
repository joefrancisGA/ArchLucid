> **Scope:** Operator cookbook — Day-7 / Day-30 voluntary reuse checkpoints after the first finalized review. Not a buyer self-serve checklist.

# Operator pilot stickiness checklist

Use after the first committed golden-manifest review to confirm the pilot is building a repeat-review habit — not only a one-time demo.

## Day-7 checkpoint

- [ ] Sponsor or architect opened the finalized review at least once since finalize.
- [ ] At least one follow-on action exists (second review started, recurrence scheduled, or governance decision recorded).
- [ ] Record voluntary usage in the pilot reuse cohort tracker (`docs/go-to-market/templates/pilot-reuse-cohort-tracker.template.json`).

## Day-30 checkpoint

- [ ] Second review completed **or** explicit deferral documented with sponsor sign-off.
- [ ] Compare/drift surfaces were used when a second run exists (`docs/library/REPEAT_REVIEW_LOOP.md`).
- [ ] Mark `trackingComplete: true` only after day-30 is recorded.

## Related runbooks

- [`FIRST_PILOT_OPERATOR_PATH.md#printable-first-run-evidence-checklist`](./FIRST_PILOT_OPERATOR_PATH.md#printable-first-run-evidence-checklist) — first finalize proof (`FIRST_RUN_EVIDENCE_CHECKLIST.md` alias)
- [`FIRST_PILOT_EVIDENCE_BUNDLE.md`](./FIRST_PILOT_EVIDENCE_BUNDLE.md) — sponsor packet collection
- [`REPEAT_REVIEW_LOOP.md`](../library/REPEAT_REVIEW_LOOP.md) — second-review operating loop
