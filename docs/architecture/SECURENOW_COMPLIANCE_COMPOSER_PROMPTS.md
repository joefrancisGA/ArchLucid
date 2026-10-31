> **Scope:** Paste-ready Composer prompts for SecureNow compliance readiness. Internal engineering only. Do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/securenow-compliance-00-index.md`](../../.cursor/prompts/securenow-compliance-00-index.md)

# SecureNow compliance readiness — Composer prompts

**Created:** 2026-10-30 · **Status:** Not started. **Audience:** Composer 2.5 slow (`composer-2.5`)

Compliance Readiness scored **48** for SecureNow on the 30 October 2026 desk pass. ArchLucid scored **71** because the platform has a self-assessment matrix and trust-center honesty. SecureNow already records framework mappings, audit-evidence lineage, and a human disposition. These prompts add a duty split, a coverage card limited to packs that already exist, a markdown download of one loaded lineage, and a warn-only checker. They do not start a CPA SOC 2 program (**G-REAL-05**), a third-party pen test (**G-ASSURANCE-02**), or a compliance score.

Paste one numbered file per session, from [`.cursor/prompts/`](../../.cursor/prompts/).

| ID | Paste file | What moves |
|----|------------|------------|
| **SN-COMP-01** | `securenow-compliance-01-responsibility.md` | `docs/securenow/CONTROL_EVIDENCE_RESPONSIBILITY.md` |
| **SN-COMP-02** | `securenow-compliance-02-coverage.md` | `docs/securenow/FRAMEWORK_COVERAGE.md` |
| **SN-COMP-03** | `securenow-compliance-03-lineage-export.md` | Audit evidence markdown download from the loaded lineage |
| **SN-COMP-04** | `securenow-compliance-04-checker.md` | `scripts/ci/check_securenow_compliance_notes.py` and CI |
| **SN-COMP-HOLD** | `securenow-compliance-hold.md` | Stop list |

Run **SN-COMP-01**, then **02**, then **03**, then **04**. **SN-COMP-HOLD** is not a build step.
