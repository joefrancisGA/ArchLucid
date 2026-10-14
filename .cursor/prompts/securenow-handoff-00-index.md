<!-- Engineer-to-analyst handoff — Luna prompts (gaps 4–5).
     Source: docs/securenow/ENGINEER_ANALYST_HANDOFF.md.
     SN-HAND-05–10 are shipped on trunk. Do not implement from this index. -->

# Engineer-to-analyst handoff — prompt archive (SN-HAND-05–10)

**Status:** **Shipped** on trunk (**SN-HAND-05–10**). Paste prompts only for scoped fixes or regression work; do not greenfield.

Copy-paste docs index: [`docs/architecture/SECURENOW_ENGINEER_ANALYST_HANDOFF_LUNA_PROMPTS.md`](../../docs/architecture/SECURENOW_ENGINEER_ANALYST_HANDOFF_LUNA_PROMPTS.md).

Design note: [`docs/securenow/ENGINEER_ANALYST_HANDOFF.md`](../../docs/securenow/ENGINEER_ANALYST_HANDOFF.md).

## Gap 5 (verified association) — shipped

| # | Prompt | What moved |
|---|--------|------------|
| 1 | **SN-HAND-05** | Association table, repository, SQL and in-memory. |
| 2 | **SN-HAND-06** | Write the row when verification passes and both ids are present. |
| 3 | **SN-HAND-07** | Lineage read returns matching rows. |
| 4 | **SN-HAND-08** | Show the row on Audit evidence and Remediation tracker. |

## Gap 4 (latest attempt) — shipped

| # | Prompt | What moved |
|---|--------|------------|
| 1 | **SN-HAND-09** | Lineage returns `latestRemediationAttempt` when a mapped instance tried the control and has no association row on this response. |
| 2 | **SN-HAND-10** | Audit evidence shows that attempt. No positive checkbox change. |

**SN-HAND-HOLD** is not a build step. Gaps 1–3 were UI-only slices on trunk before this set.
