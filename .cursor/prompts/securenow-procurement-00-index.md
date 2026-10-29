<!-- SecureNow procurement readiness — Composer prompts.
     Origin: 2026-10-29 desk review. Procurement Readiness 38.
     Do not implement from this index. -->

# SecureNow procurement — prompt set (SN-PROC-01–04)

Paste **one** numbered file per session. Run each on Composer 2.5 slow (`composer-2.5`). Do not use a fast-tier slug.

Copy-paste docs index: [`docs/architecture/SECURENOW_PROCUREMENT_COMPOSER_PROMPTS.md`](../../docs/architecture/SECURENOW_PROCUREMENT_COMPOSER_PROMPTS.md).

| # | Prompt | What moves |
|---|--------|------------|
| 1 | **SN-PROC-01** | SecureNow procurement pack index. Status labels only. No new assurance claims. |
| 2 | **SN-PROC-02** | One-page buyer security brief. Collection, non-goals, verification, assurance honesty. |
| 3 | **SN-PROC-03** | Short SIG-style overlay. Answers that differ from the ArchLucid architecture-review packet. |
| 4 | **SN-PROC-04** | Static checker for the three docs, plus a CI step and unit tests. |
| — | **SN-PROC-HOLD** | Stop list. Paste only when a session drifts. |

Run **SN-PROC-01** first. **SN-PROC-02** and **SN-PROC-03** do not share files and may follow in either order. **SN-PROC-04** last. **SN-PROC-HOLD** is not a build step.
