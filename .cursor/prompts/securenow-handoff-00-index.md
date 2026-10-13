<!-- Engineer-to-analyst handoff, gap 5 — Luna prompts.
     Source: docs/securenow/ENGINEER_ANALYST_HANDOFF.md gap 5.
     Do not implement from this index. -->

# Engineer-to-analyst handoff — gap 5 prompt set (SN-HAND-05–08)

Paste **one** numbered file per session, in order. Every prompt runs on Composer 2.5 slow (`composer-2.5`). Do not use a fast-tier slug.

Copy-paste docs index: [`docs/architecture/SECURENOW_ENGINEER_ANALYST_HANDOFF_LUNA_PROMPTS.md`](../../docs/architecture/SECURENOW_ENGINEER_ANALYST_HANDOFF_LUNA_PROMPTS.md).

Design note: [`docs/securenow/ENGINEER_ANALYST_HANDOFF.md`](../../docs/securenow/ENGINEER_ANALYST_HANDOFF.md).

| # | Prompt | What moves |
|---|--------|------------|
| 1 | **SN-HAND-05** | Association table, repository, SQL and in-memory. No verify write yet. |
| 2 | **SN-HAND-06** | Write the row when verification passes and both ids are present. Return it on instance detail. |
| 3 | **SN-HAND-07** | Existing audit-evidence lineage read returns matching rows. No new score. |
| 4 | **SN-HAND-08** | Show the row on Audit evidence and Remediation tracker. |
| — | **SN-HAND-HOLD** | Stop list. Paste only when a session drifts. |

**SN-HAND-HOLD** is not a build step. Gaps 1–3 and gap 4 are not in this set.
