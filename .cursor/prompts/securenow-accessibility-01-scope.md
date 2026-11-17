# SN-A11Y-01 — SecureNow accessibility scope note

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-A11Y prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ACCESSIBILITY_COMPOSER_PROMPTS.md`

## Goal

A short note that says what accessibility target SecureNow inherits, which operator surfaces are in scope, and what this repository does not claim.

## Why

Accessibility scored **42** for SecureNow. The platform statement lives at `/accessibility`, and the security product line redirects that marketing route to `/`. A reviewer on SecureNow has no product-line note. This file is the note. It is not a certification and not a user study.

## Read first

- `ACCESSIBILITY.md` (WCAG 2.2 AA target and the sentence that automated checks are not a certification)
- `docs/security/ACCESSIBILITY_MAILBOX.md` (contact alias)
- `archlucid-ui/src/lib/product-line/securenow-marketing-route-policy.ts` (`/accessibility` stays blocked)
- `docs/securenow/README.md` (Commercial engineering list)

## What to build

1. Branch `sn-a11y/01-scope` from current `master`.
2. Add `docs/securenow/ACCESSIBILITY_SCOPE.md`.
3. Line 1 is a scope blockquote: `> **Scope:** SecureNow accessibility scope for operators and reviewers. Not a WCAG certification, not a VPAT, and not a record of assistive-technology user testing.`
4. Sections, in this order:
   - `## Target` — SecureNow uses the same target as [`../../ACCESSIBILITY.md`](../../ACCESSIBILITY.md): **WCAG 2.2 Level AA**. Automated checks support that target. They do not certify it.
   - `## Surfaces in scope` — a bullet list, names only: SecureNow Home, Priorities & waves, Path inspect, Question queue, Remediation tracker, Audit evidence, and infrastructure diagrams on the security product line.
   - `## Where the public ArchLucid statement lives` — one sentence: the marketing page `/accessibility` is for the architecture-review host. On the security product line that route redirects to `/`. Do not treat that redirect as a SecureNow accessibility statement.
   - `## How to report a barrier` — mailto `mailto:accessibility@archlucid.net` with visible text `accessibility@archlucid.net`. Say the alias is the same custodian path as the platform mailbox note. Do not invent a second mailbox.
   - `## What this note does not do` — three sentences: it does not claim WCAG certification; it does not claim a completed VPAT; it does not claim that assistive-technology user testing was performed.
5. Add a README bullet under Commercial engineering, after the buyer overview bullet if that bullet exists, otherwise after the fixture storyboard bullet: the scope note states the shared WCAG target and the report mailbox. It is not a certification.

## Tests

Read the new file. Confirm `WCAG 2.2`, `accessibility@archlucid.net`, `not a VPAT` or `not a completed VPAT`, and no `$`.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not edit `ACCESSIBILITY.md` or the marketing `/accessibility` page.
- Do not remove `/accessibility` from `SECURENOW_BLOCKED_MARKETING_ROUTE_PREFIXES`.
- Do not add a product route in this session.
- Do not commit.

## Done when

`ACCESSIBILITY_SCOPE.md` names the shared target, the blocked marketing route, and the report mailbox, and it refuses certification language.
