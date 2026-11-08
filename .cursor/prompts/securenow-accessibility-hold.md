# SN-A11Y-HOLD — SecureNow accessibility stop list

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file only when a session starts building something this list forbids. This file is not a feature.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ACCESSIBILITY_COMPOSER_PROMPTS.md`

## Stop

Do not build any of the following while implementing SN-A11Y prompts:

- A claim of WCAG certification, "fully accessible", or "VPAT complete".
- A claim that assistive-technology user testing was performed.
- Removing `/accessibility` from `SECURENOW_BLOCKED_MARKETING_ROUTE_PREFIXES`.
- A second page at `src/app/(operator)/accessibility/page.tsx` (that URL collides with marketing).
- Rendering `AccessibilityMarketingPublicView` or the public marketing header on the SecureNow operator page.
- A new mailbox. Reports stay on `accessibility@archlucid.net`.
- A sidebar item or a marketing-nav item for the operator page.
- Disabling axe rules to make SN-A11Y-03 pass.
- Adding SecureNow routes to the live Playwright accessibility matrix in the same session as SN-A11Y-03.
- A rewrite of `SECURENOW_HOME_PAGE_LEAD` or `SECURENOW_SECURITY_HOME_SECTION_LEAD`.
- Setting `continue-on-error` to false on the accessibility checker.
- More than one SN-A11Y prompt in the same session.
- A review workspace tab hidden behind More.

If the session is about to do one of these, stop and report which line it hit.
