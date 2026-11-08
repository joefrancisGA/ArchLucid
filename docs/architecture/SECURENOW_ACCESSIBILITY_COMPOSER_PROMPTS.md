> **Scope:** Paste-ready Composer prompts for SecureNow accessibility. Internal engineering only. Do not implement from this index.
> **Paste-ready files:** [`.cursor/prompts/securenow-accessibility-00-index.md`](../../.cursor/prompts/securenow-accessibility-00-index.md)

# SecureNow accessibility — Composer prompts

**Created:** 2026-10-30 · **Updated:** 2026-11-01 · **Status:** SN-A11Y-01–04 shipped on trunk. **Audience:** Composer 2.5 slow (`composer-2.5`)

Accessibility scored **42** for SecureNow on the 30 October 2026 desk pass. The platform statement at `/accessibility` is a marketing route, and the security product line redirects it home. SN-A11Y-01–04 add a scope note, an operator page that does not collide with that URL, a jest-axe check, and a warn-only checker. They do not certify WCAG, publish a VPAT, or claim assistive-technology user testing. The implementation is on trunk in commit `3d49c07ebb`.

Paste one numbered file per session, from [`.cursor/prompts/`](../../.cursor/prompts/).

| ID | Paste file | What moves |
|----|------------|------------|
| **SN-A11Y-01** | `securenow-accessibility-01-scope.md` | `docs/securenow/ACCESSIBILITY_SCOPE.md` (**shipped**) |
| **SN-A11Y-02** | `securenow-accessibility-02-operator-page.md` | `/administration/securenow-accessibility` and a Home link (**shipped**) |
| **SN-A11Y-03** | `securenow-accessibility-03-axe.md` | `src/accessibility/securenow-accessibility-axe.test.tsx` (**shipped**) |
| **SN-A11Y-04** | `securenow-accessibility-04-checker.md` | `scripts/ci/check_securenow_accessibility.py` and CI (**shipped**) |
| **SN-A11Y-HOLD** | `securenow-accessibility-hold.md` | Stop list |

**SN-A11Y-01** through **SN-A11Y-04** are on trunk. Do not redo them. **SN-A11Y-HOLD** is not a build step.
