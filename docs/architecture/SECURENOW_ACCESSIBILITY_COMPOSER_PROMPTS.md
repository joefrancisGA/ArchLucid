> **Scope:** Paste-ready Composer prompts for SecureNow accessibility. Internal engineering only. Do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/securenow-accessibility-00-index.md`](../../.cursor/prompts/securenow-accessibility-00-index.md)

# SecureNow accessibility — Composer prompts

**Created:** 2026-10-30 · **Status:** Not started. **Audience:** Composer 2.5 slow (`composer-2.5`)

Accessibility scored **42** for SecureNow on the 30 October 2026 desk pass. The platform statement at `/accessibility` is a marketing route, and the security product line redirects it home. These prompts add a scope note, an operator page that does not collide with that URL, a jest-axe check, and a warn-only checker. They do not certify WCAG, publish a VPAT, or claim assistive-technology user testing.

Paste one numbered file per session, from [`.cursor/prompts/`](../../.cursor/prompts/).

| ID | Paste file | What moves |
|----|------------|------------|
| **SN-A11Y-01** | `securenow-accessibility-01-scope.md` | `docs/securenow/ACCESSIBILITY_SCOPE.md` |
| **SN-A11Y-02** | `securenow-accessibility-02-operator-page.md` | `/administration/securenow-accessibility` and a Home link |
| **SN-A11Y-03** | `securenow-accessibility-03-axe.md` | `src/accessibility/securenow-accessibility-axe.test.tsx` |
| **SN-A11Y-04** | `securenow-accessibility-04-checker.md` | `scripts/ci/check_securenow_accessibility.py` and CI |
| **SN-A11Y-HOLD** | `securenow-accessibility-hold.md` | Stop list |

Run **SN-A11Y-01**, then **02**, then **03**, then **04**. **SN-A11Y-HOLD** is not a build step.
