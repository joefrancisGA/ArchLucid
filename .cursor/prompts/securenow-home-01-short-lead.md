# SN-HOME-01 — Short SecureNow Home description

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-HOME prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_HOME_WORK_SUMMARY_LUNA_PROMPTS.md`

## Goal

SecureNow Home opens with one plain description and one plain honesty sentence. The sentence that says all seven destinations are on this hub is gone from SecureNow Home.

## Why

The subtitle still describes inventory evidence workbenches, diagrams, reconciliation, resource hubs, grounded Ask, and remediation instances. Under that, SecureNow Home says "All seven destinations are available from this hub." The grouped page lists many more links in five groups. The infrastructure overview really does list seven workbench rows, and that sentence can stay there. On SecureNow Home it is false, and the grouping is already visible.

## Read first

- `archlucid-ui/src/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient.tsx`
- `archlucid-ui/src/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient.securenow.test.tsx`
- `archlucid-ui/src/lib/governance/governance-infrastructure-copy.ts` (`GOVERNANCE_INFRASTRUCTURE_OVERVIEW_PAGE_LEAD`, `SECURENOW_HOME_GROUPED_SECTIONS_INTRO`)
- `archlucid-ui/src/lib/governance/governance-infrastructure-evidence-copy.ts` (`GOVERNANCE_INFRASTRUCTURE_OVERVIEW_CLAIM_DISCIPLINE`)

## What to build

1. Branch `sn-home/01-short-lead` from current `master`.
2. When `secureNowHome` is true, set the header subtitle to: "Review security findings, explore your Azure environment, and verify remediation."
3. When `secureNowHome` is true, remove `SECURENOW_HOME_GROUPED_SECTIONS_INTRO` from the page. Do not replace it with a counted destination total.
4. Keep the claim-discipline slot. For SecureNow Home only, change that sentence to: "Advice and inventory evidence on this page are not an official compliance report."
5. Leave the Architecture infrastructure overview subtitle, hub intro, and claim discipline as they are. `INFRASTRUCTURE_WORKBENCH_ROWS` stays seven rows, and that overview may still say seven destinations.

## Tests

Update `InfrastructureOverviewClient.securenow.test.tsx` so SecureNow Home expects the new subtitle and honesty sentence, and does not expect "All seven destinations".

Keep a test that the Architecture overview still mentions seven destinations when `secureNowHome` is absent and the product line is not security.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case.
- No new API, no new route, no new package.
- From `archlucid-ui`, run the Vitest files you touched and `npx tsc --noEmit -p tsconfig.json`.
- Do not commit.

## Done when

SecureNow Home leads with the short description and the short honesty sentence. The seven-destinations sentence remains only on the infrastructure overview that lists seven workbenches.
