# SN-ADOPT-07 — Keep the collection gap on the environment line

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-ADOPT prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_ADOPTION_FRICTION_COMPOSER_PROMPTS.md`

## Goal

When Home has no collection, the environment line still says that, and its link is cloud connections. The Start here lead does not replace that line.

## Why

`SecureNowHomeEnvironmentContext` already renders `No collection yet` with href `/integrations/cloud-connections` when the snapshot list is empty. SN-ADOPT-06 puts a blocked-collection sentence on Start here. A later edit can drop the environment link and leave only a paragraph.

## Read first

- `archlucid-ui/src/components/product-line/SecureNowHomeEnvironmentContext.tsx`
- `archlucid-ui/src/lib/product-line/securenow-first-hour-home-copy.ts`
- Tests that render `securenow-home-environment-context`

## What to build

1. Branch `sn-adopt/07-collection-line` from current `master` after SN-ADOPT-06 is present.
2. Do not redesign collection status. Keep the empty-snapshot branch that renders the link text `No collection yet` to `/integrations/cloud-connections`.
3. Add or extend a test that renders `SecureNowHomeEnvironmentContext` with an empty snapshot list and finds a link named `No collection yet` whose href is `/integrations/cloud-connections`.
4. In that same test file, do not assert a dollar amount, a timed SLA, or a clean bill of health.

## Tests

From `archlucid-ui`, run the test file you added or extended.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2. On a Linux Cloud Agent, use `pwsh -NoProfile -File scripts/agent/check-working-tree-path.ps1 -Path '<path>'`.
- Do not mark a missing capture as healthy.
- Do not add a setup wizard.
- Do not commit.

## Done when

An empty collection on Home still has one link, `No collection yet`, to cloud connections, covered by a test.
