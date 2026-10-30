<!-- SecureNow procurement readiness — Composer prompts.
     Origin: 2026-10-29 desk review. Procurement Readiness 38.
     Do not implement from this index. -->

# SecureNow procurement — prompt set (SN-PROC-01–09)

Paste **one** numbered file per session. Run each on Composer 2.5 slow (`composer-2.5`). Do not use a fast-tier slug.

Copy-paste docs index: [`docs/architecture/SECURENOW_PROCUREMENT_COMPOSER_PROMPTS.md`](../../docs/architecture/SECURENOW_PROCUREMENT_COMPOSER_PROMPTS.md).

| # | Prompt | What moves |
|---|--------|------------|
| 1 | **SN-PROC-01** | SecureNow procurement pack index. Status labels only. No new assurance claims. **Shipped.** |
| 2 | **SN-PROC-02** | One-page buyer security brief. Collection, non-goals, verification, assurance honesty. **Shipped.** |
| 3 | **SN-PROC-03** | Short SIG-style overlay. Answers that differ from the ArchLucid architecture-review packet. **Shipped.** |
| 4 | **SN-PROC-04** | Static checker for the first three docs, plus a CI step and unit tests. **Shipped.** |
| 5 | **SN-PROC-05** | Data-processing schedule. Template only. Blanks stay where the pilot offer has no agreed term. |
| 6 | **SN-PROC-06** | Subprocessors delta against the platform register. Does not add a vendor. |
| 7 | **SN-PROC-07** | Questionnaire crosswalk. Routes questions to the platform packet or the SecureNow overlay. |
| 8 | **SN-PROC-08** | Quote cover. SKU identifiers only. No prices. |
| 9 | **SN-PROC-09** | Extend the pack checker to the four new files. CI stays warn-only. |
| — | **SN-PROC-HOLD** | Stop list. Paste only when a session drifts. |

**SN-PROC-01** through **SN-PROC-04** are on trunk. Run **SN-PROC-05**, then **SN-PROC-06**, then **SN-PROC-07**, then **SN-PROC-08**, then **SN-PROC-09**. They share the pack index and the claim scanner, so do not run them in parallel. **SN-PROC-HOLD** is not a build step.
