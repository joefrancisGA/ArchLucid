# Defect escape analysis loop (Prompt 8)

Four-step loop for every production or staging escape:

1. **Classify** — graph merge, FSM / lifecycle, LLM confinement, tenancy / concurrency.
2. **Which technique should have caught it** — property test, metamorphic test, transition table, fuzz, runtime invariant, etc.
3. **Fix the technique** — add or tighten the test / checker / table; link the PR.
4. **Quarterly tally** — count escapes by class and whether an example test exists (yes = process failure).

## Escape log template

| Date | Id | Class | Escaped to | Technique that should have caught it | Technique fix PR | Example test used? |
| --- | --- | --- | --- | --- | --- | --- |
| YYYY-MM-DD | TB-#### | graph / FSM / LLM-confinement / tenancy-concurrency | staging / prod | e.g. merge property suite | https://github.com/.../pull/NNN | yes / no |

New rows: copy `docs/quality/defect-escape-log/TEMPLATE.md` into dated entries in the same folder.

See also `docs/quality/OUTBOX_LEASE_FINALIZE_ENUMERATION.md` and graph merge invariant checker (`GraphMergeInvariantChecker`).
