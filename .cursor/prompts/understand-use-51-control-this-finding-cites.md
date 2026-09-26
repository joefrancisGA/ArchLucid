# UU-51 — Control this finding cites

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-52 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave F (**UU-51**). **Depends on:** the SecureNow remediation priority queue.

## Goal

The priority queue Control header says the value is the control this finding cites. The control id stays visible.

## Why

The cell shows values such as `AC-2` with a header that only says Control. A reader cannot tell whether that cell is a policy, a finding id, or a sort key.

## Read first

- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx` (the table whose `ariaLabel` is "Remediation priority queue")

## What to build

1. Branch `uu/51-control-this-finding-cites` from current `master`.
2. On the Control header of that rendered priority queue, keep the word Control and add this helper: "Control this finding cites."
3. Keep each cell's `controlId`. When `controlId` is missing, keep the existing em dash.
4. Do not add a column. Do not move the id behind Show identifiers.
5. The page renders this queue inside `RemediationFactoryClient.tsx`. Do not add a second queue. Leave `RemediationFactoryPriorityTable.tsx` alone unless you find a render path that already uses it.

## Acceptance criteria

- The Control header shows "Control this finding cites."
- A row whose `controlId` is `AC-2` still shows `AC-2`.
- The path list is unchanged.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case. The helper is exact.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run "src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.test.tsx"
```

Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to read the Control header, then the `AC-2` cell. Wait for that look before any commit.
