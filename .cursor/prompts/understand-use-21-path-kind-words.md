# UU-21 — Plain path-kind labels

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-22 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave C (**UU-21**). **Depends on:** ranked path rows that already carry `pathKind`.

## Goal

A ranked SecureNow path row shows a plain kind label. The stored kind string does not change.

## Why

The kind column can show `IntendedReachability`, `Privilege`, or `CapabilityToFlow`. Those names are engine names. The reader needs the job the path describes.

## Read first

- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryRankedPathsTable.tsx`
- `archlucid-ui/src/lib/security-evidence-path-presentation.ts`
- `archlucid-ui/src/lib/security-evidence-path-types.ts`
- `ArchLucid.Core/InfraEvidence/PathKind.cs`

## What to build

1. Branch `uu/21-path-kind-words` from current `master`.
2. Add a display helper next to the existing band formatter. Map only kinds you find in `PathKind`:
   - Intended reachability → "Can reach"
   - Privilege → "Privilege"
   - Capability to flow → "May access"
3. An unmapped kind keeps its existing display string. Do not invent a threat for it.
4. Use the helper in the ranked-path kind cell and on the path-inspect kind chip. Keep the raw kind available in the existing identifier disclosure or a `title` attribute, not as the lead text.
5. Do not change rank, filters, or the API enum.

## Acceptance criteria

- A row whose kind is the intended-reachability value shows "Can reach" before the band.
- An unknown kind is still visible as its current string.
- Tests do not expect a new score.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- Sentence case for the new labels above. They are the exact strings.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/lib/security-evidence-path-presentation.test.ts "src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.test.tsx"
```

Add a helper test for each mapped kind. Run only the tests you add or change.

## Done when

Tests pass. Tell the owner to read a reachability row and a privilege row. Wait for that look before any commit.
