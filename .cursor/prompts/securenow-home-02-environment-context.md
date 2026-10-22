# SN-HOME-02 — Environment and evidence freshness

**Model:** Composer 2.5 slow (`composer-2.5`). Paste this file as the whole task. Do not use a fast-tier slug and do not use a model outside the workspace allowlist. Do not implement another SN-HOME prompt in this session.

**Repo:** `c:\ArchLucid`

**Record:** `docs/architecture/SECURENOW_HOME_WORK_SUMMARY_LUNA_PROMPTS.md`

**Depends on:** none. If SN-HOME-01 has already changed the subtitle, keep that subtitle.

## Goal

SecureNow Home states which workspace and subscription the person is looking at, when the latest inventory collection finished, and whether that collection has a gap.

## Why

A security review of the wrong subscription, or of a failed collection, is a wrong review. Today the title area does not say which environment is in scope or how current the evidence is.

## Read first

- `archlucid-ui/src/app/(operator)/governance/infrastructure/_sections/InfrastructureOverviewClient.tsx`
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-drift-api.ts` (`fetchInfraEvidenceSnapshots`)
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-drift-types.ts` (`InfraEvidenceSnapshotSummary`)
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-snapshot-capture-status.ts` (`infraEvidenceSnapshotCaptureStatusTagProps`)
- `archlucid-ui/src/lib/relative-time.ts` (`formatRelativeTime`)
- `archlucid-ui/src/lib/scope-switcher-display.ts` (`formatScopeSwitcherTriggerLabel`)
- `archlucid-ui/src/lib/design-tokens.ts` (`OPERATOR_TYPOGRAPHY`)

## What to build

1. Branch `sn-home/02-environment-context` from current `master`.
2. On SecureNow Home only, under the header and above the grouped directory, render one context line. Not a card grid. Not KPI tiles.
3. The line contains, in this order, only the parts that have data:
   - **Workspace.** The same short name `formatScopeSwitcherTriggerLabel` already shows for the active workspace. Text only. Do not add a second workspace switcher.
   - **Subscription.** From the newest snapshot on page 1 of `fetchInfraEvidenceSnapshots` with a small page size (20 or fewer). Use `subscriptionName` when it is non-empty, otherwise the subscription id. When that page contains more than one distinct subscription, say the count ("3 subscriptions") instead of a single name. Link this phrase to `/integrations/cloud-connections`.
   - **Latest collection.** `formatRelativeTime` of that snapshot's `capturedUtc`, linked to `/infrastructure/snapshots-drift`.
   - **Collection gap.** Call `infraEvidenceSnapshotCaptureStatusTagProps` on that snapshot's `captureStatus`. When the presentation kind is `needs-attention`, `blocked`, or `in-progress`, append that presentation's existing `description`. Link the gap phrase to `/integrations/cloud-connections`. When the kind is `ready`, omit the gap phrase.
4. When the snapshot list is empty, the line says "No collection yet" and links to `/integrations/cloud-connections`. It does not link to Manual upload first. Workspace still shows when known.
5. A failed snapshot load shows the API reason in this line only. The directory still renders.
6. Do not add a tenant name. The snapshot summary has subscription, not tenant. Leave tenant out and say so in the session summary.
7. Leave the Architecture home and the infrastructure overview unchanged.

## Tests

1. A ready snapshot renders workspace, one subscription name, and a relative collection time, and does not render a gap description.
2. Two subscriptions on the first page render a count, not one subscription's name.
3. A failed capture status renders the existing blocked description and links to `/integrations/cloud-connections`.
4. An empty snapshot list renders "No collection yet" with that same href.
5. A rejected snapshot request renders the error text and still renders the Findings heading.
6. The Architecture product line home does not render this line.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- No new API, no new SQL, no new package. One snapshot list call.
- Security: the line uses the snapshot and workspace calls the product already makes for this signed-in scope.
- Scalability: page size stays small. Do not load inventory rows or diff rows here.
- Reliability: a failed load stays inside this line.
- Cost: no new collector and no new stored aggregate.
- Neutral surface, `space-y-4`. `OPERATOR_TYPOGRAPHY.body` or `helper`. No pastel card.
- Sentence case.
- From `archlucid-ui`, run the Vitest files you touched and `npx tsc --noEmit -p tsconfig.json`.
- Do not commit.

## Done when

SecureNow Home shows workspace, subscription scope, latest collection time, and a collection gap when the existing capture status says there is one.
