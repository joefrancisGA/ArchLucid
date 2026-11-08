# SN-MKT-01 — Security section states the buyer job

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-MKT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_MARKETABILITY_COMPOSER_PROMPTS.md`

## Goal

The Security group on SecureNow Home tells a buyer what SecureNow is for. The recommended first row opens Priorities & waves, where a ranked path and its cited hops live.

## Why

Marketability is 36. Differentiability is 74. The product distinction is already written in `docs/securenow/BUYER_PROOF_DEMO.md`. The Security section lead still says: "Triage security findings, create and run remediation factory workflows, review remediation patterns, and track remediation instances." That sentence describes an internal console. The recommended-first row is My findings.

## Read first

- `archlucid-ui/src/lib/product-line/securenow-security-home-copy.ts`
- `archlucid-ui/src/components/product-line/SecureNowSecurityHomeSection.tsx`
- `archlucid-ui/src/lib/product-line/securenow-nav-labels.ts` (label for `/security/remediation-factory` is "Priorities & waves")
- `archlucid-ui/src/lib/governance/governance-infrastructure-copy.ts` (`SECURENOW_HOME_PAGE_LEAD`, `SECURENOW_HOME_CLAIM_DISCIPLINE`)
- `docs/securenow/BUYER_PROOF_DEMO.md` (buyer job and the claims that must not be made)

## What to build

1. Branch `sn-mkt/01-security-lead` from current `master`.
2. Replace `SECURENOW_SECURITY_HOME_SECTION_LEAD` with: "See which Azure permission and network combinations form a possible access path, where you could intervene, and whether a later capture shows a change."
3. Keep My findings, Fix playbooks, and Remediation tracker in `SECURENOW_SECURITY_HOME_ROWS`.
4. Move `recommendedFirst: true` from My findings to the Priorities & waves row (`/security/remediation-factory`). Only one row keeps `recommendedFirst`.
5. Set that row's summary to: "Open one ranked path and its cited hops."
6. Leave `SECURENOW_HOME_PAGE_LEAD` and `SECURENOW_HOME_CLAIM_DISCIPLINE` as they are. SN-HOME-01 already shipped those.
7. Leave the Remediation tracker summary that says SecureNow records the plan and the later collection and does not change Azure.

## Tests

Add a Vitest next to the copy module. It expects the new lead, expects "possible access path", and does not expect "remediation factory" in that lead. It expects `recommendedFirst` only on `/security/remediation-factory`.

Run `securenow-home-copy-hyperscaler-guard.test.ts`. The new lead names Azure only.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case.
- No new API, route, package, or nav item.
- Do not edit the pilot checklist, the private quote sheet, or the support commitment.
- From `archlucid-ui`, run the Vitest files you touched and `npx tsc --noEmit -p tsconfig.json`.
- Do not commit.

## Done when

The Security section lead is the buyer job, and the recommended first row is Priorities & waves. The page subtitle from SN-HOME-01 is unchanged.
