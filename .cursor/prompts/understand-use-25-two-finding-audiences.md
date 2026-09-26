# UU-25 — Say which findings these are

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-26 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave C (**UU-25**). **Depends on:** the architecture findings queue and the SecureNow remediation queue. Both already exist.

## Goal

The architecture findings queue and the SecureNow queue each say what kind of finding they hold.

## Why

Both surfaces use the word "Findings". One is an architecture review finding. The other is an operational security finding that cites a path. Landing on the wrong queue looks like missing data.

## Read first

- `archlucid-ui/src/lib/governance/governance-findings-evidence-copy.ts`
- `archlucid-ui/src/app/(operator)/governance/findings/GovernanceFindingsQueueHeader.tsx`
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx`
- `docs/library/SECURENOW_ARCHITECT_PLANE.md` (operational findings cite paths; they are not sealed-review findings)

## What to build

1. Branch `uu/25-two-finding-audiences` from current `master`.
2. On the architecture findings queue header, add one line: "These are architecture review findings for the open review."
3. On the remediation factory priority queue, add one line: "These are SecureNow findings for the current inventory snapshot. They are not architecture review findings."
4. Do not rename the nav item, the route, or the tab. Do not merge the queues.
5. Do not say "operator".

## Acceptance criteria

- Each queue shows its own sentence and not the other sentence.
- Routes and tab labels are unchanged.
- A test renders both strings from the copy module or the headers.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. One line each.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/lib/governance/governance-findings-evidence-copy.test.ts "src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.test.tsx"
```

## Done when

Tests pass. Tell the owner to open both queues and read the line under each title. Wait for that look before any commit.
