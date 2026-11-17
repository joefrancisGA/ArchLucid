<!-- SecureNow compliance readiness — Composer prompts.
     Origin wave: 2026-10-30 desk pass (SN-COMP-01–04). SecureNow score 48, ArchLucid 71.
     Follow-on wave: adds SN-COMP-05–07 to target Compliance Readiness 66 (weight 2).
     Do not implement from this index. -->

# SecureNow compliance readiness — prompt set (SN-COMP-01–07)

Paste **one** numbered file per session. Run each on Composer 2.5 slow (`composer-2.5`). Do not use a fast-tier slug.

Copy-paste docs index: [`docs/architecture/SECURENOW_COMPLIANCE_COMPOSER_PROMPTS.md`](../../docs/architecture/SECURENOW_COMPLIANCE_COMPOSER_PROMPTS.md).

| # | Prompt | What moves |
|---|--------|------------|
| 1 | **SN-COMP-01** | Control-evidence responsibility note. **Shipped** in PR #5605. |
| 2 | **SN-COMP-02** | Framework coverage card. **Shipped** in PR #5605. |
| 3 | **SN-COMP-03** | Markdown download of one loaded lineage. **Shipped** in PR #5605. |
| 4 | **SN-COMP-04** | Warn-only checker. **Shipped** in PR #5605. |
| 5 | **SN-COMP-05** | Operator page `/administration/securenow-compliance-notes`. |
| 6 | **SN-COMP-06** | Home **Compliance** row **Duty split**. |
| 7 | **SN-COMP-07** | Limit sentence beside **Download control evidence**. |
| — | **SN-COMP-HOLD** | Stop list. Paste only when a session drifts. |

**SN-COMP-01** through **SN-COMP-04** are on trunk. Do not redo them. Run **SN-COMP-05**, then **06**, then **07**. **SN-COMP-HOLD** is not a build step. Compliance Readiness is **66** (weight 2). Owner programs stay **G-REAL-05** and **G-ASSURANCE-02**.
