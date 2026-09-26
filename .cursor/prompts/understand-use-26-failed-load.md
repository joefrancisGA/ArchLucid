# UU-26 — A failed path load says what remains

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-27 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave C (**UU-26**). **Depends on:** `OperatorErrorRecoveryContract`.

## Goal

When ranked paths or path inspect fail to load, the screen says what failed, what is still intact, and the one retry.

## Why

Those failures currently render a status chip such as "Ranked paths unavailable" or "Path inspect unavailable". The chip names the failure. It does not say whether the snapshot, the other queue, or the last selection is still there.

## Read first

- `archlucid-ui/src/components/usability/OperatorErrorRecoveryContract.tsx`
- `archlucid-ui/src/lib/error-recovery-contract-copy.ts`
- `archlucid-ui/src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.tsx`
- `archlucid-ui/src/components/security/SecurityEvidencePathInspectPanel.tsx`

## What to build

1. Branch `uu/26-failed-load` from current `master`.
2. Replace the ranked-paths error chip and the path-inspect error chip with `OperatorErrorRecoveryContract` when those queries fail.
3. Use these sentences, filled only with facts the page already has:
   - What failed: "Ranked paths did not load." or "Path inspect did not load."
   - What's intact: "The priority queue and the selected snapshot stay on this page." when the priority queue is still showing. If that queue also failed, say "The snapshot selection stays on this page."
   - Next step: "Retry the load. This does not change Azure."
4. Wire the existing refresh or refetch action as the retry control next to the contract. Do not add a second refresh that writes data.
5. Do not clear the selected snapshot on failure.

## Acceptance criteria

- A failed ranked-path query shows all three contract lines.
- A successful query does not show the contract.
- Retry calls the existing refetch.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- No new endpoint. No Azure write.
- **Do not commit.**

## Verification

```powershell
cd archlucid-ui
npx vitest run src/components/usability/OperatorErrorRecoveryContract.test.tsx "src/app/(operator)/governance/remediation-factory/RemediationFactoryClient.test.tsx"
```

## Done when

Tests pass. Tell the owner to force a failed path load and read the three lines, then retry. Wait for that look before any commit.
