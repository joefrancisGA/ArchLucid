> **Scope:** Paste-ready Composer prompts for SecureNow compliance readiness. Internal engineering only. Do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/securenow-compliance-00-index.md`](../../.cursor/prompts/securenow-compliance-00-index.md)

# SecureNow compliance readiness — Composer prompts

**Created:** 2026-10-30 · **Updated:** 2026-11-01 · **Status:** SN-COMP-01–04 shipped in PR #5605. SN-COMP-05–07 are the follow-on. **Audience:** Composer 2.5 slow (`composer-2.5`)

Compliance Readiness is **66** (weight 2) on the 1 Nov 2026 board. SN-COMP-01–04 added the duty split, the coverage card, the lineage markdown download, and the warn-only checker. SN-COMP-05–07 put that duty split on an operator page, link it from Home, and label the download as not an attestation. They do not start a CPA SOC 2 program (**G-REAL-05**), a third-party pen test (**G-ASSURANCE-02**), or a compliance score.

Paste one numbered file per session, from [`.cursor/prompts/`](../../.cursor/prompts/).

| ID | Paste file | What moves |
|----|------------|------------|
| **SN-COMP-01** | `securenow-compliance-01-responsibility.md` | `docs/securenow/CONTROL_EVIDENCE_RESPONSIBILITY.md` (**shipped**) |
| **SN-COMP-02** | `securenow-compliance-02-coverage.md` | `docs/securenow/FRAMEWORK_COVERAGE.md` (**shipped**) |
| **SN-COMP-03** | `securenow-compliance-03-lineage-export.md` | Audit evidence markdown download from the loaded lineage (**shipped**) |
| **SN-COMP-04** | `securenow-compliance-04-checker.md` | `scripts/ci/check_securenow_compliance_notes.py` and CI (**shipped**) |
| **SN-COMP-05** | `securenow-compliance-05-operator-page.md` | `/administration/securenow-compliance-notes` |
| **SN-COMP-06** | `securenow-compliance-06-home-row.md` | Home **Compliance** row **Duty split** |
| **SN-COMP-07** | `securenow-compliance-07-download-limit.md` | Limit sentence beside **Download control evidence** |
| **SN-COMP-HOLD** | `securenow-compliance-hold.md` | Stop list |

**SN-COMP-01** through **SN-COMP-04** are on trunk. Do not redo them. Run **SN-COMP-05**, then **06**, then **07**. **SN-COMP-HOLD** is not a build step.
