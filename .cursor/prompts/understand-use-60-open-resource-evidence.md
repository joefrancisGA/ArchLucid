# UU-60 — Open resource evidence from a hop

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement another UU item in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave F (**UU-60**). **Depends on:** UU-48. Keep the Internet boundary sentence.

## Goal

A hop that already has a resource id links to the existing resource page.

## Why

The hop shows a resource name. The resource page already exists. The hop does not offer a way to open the evidence for that resource.

## Read first

- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx` (hop rows)
- `archlucid-ui/src/lib/security-evidence-path-types.ts` (`SecurityEvidencePathHop.cloudResourceId`)
- `archlucid-ui/src/lib/infra-evidence/infra-evidence-hub-filter-url.ts` (`buildResourceHubOverviewHref`)

## What to build

1. Branch `uu/60-open-resource-evidence` from current `master`.
2. When `hop.cloudResourceId` is non-empty, add a link labeled "Open resource evidence." The href is `buildResourceHubOverviewHref(hop.cloudResourceId, { snapshotId: path.snapshotId })` when the path already has a snapshot id.
3. Do not turn the word Internet into that link. Keep "Internet is the public boundary, not an Azure resource." on the first Internet hop.
4. When `cloudResourceId` is missing, do not add a link and do not invent a resource.
5. Do not add a collector or call Azure.

## Acceptance criteria

- A hop with a resource id shows "Open resource evidence."
- The href includes that resource id.
- An Internet hop with no resource id has no resource link.
- The Internet boundary sentence is unchanged.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The link label is exact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/components/security/SecurityEvidencePathInspectPanel.test.tsx
```

## Done when

Tests pass. Tell the owner to open a hop that has a resource id and follow "Open resource evidence." Wait for that look before any commit.
