# UU-18 — Path changes between two snapshots

**Model:** GPT-5.6 Luna. Paste this file as the whole task. Do not implement UU-19 in this session.

**Repo:** `c:\ArchLucid`

**Wave:** Understand and use, wave B (**UU-18**). **Depends on:** persisted path rows for two snapshots in one tenant. The drift workbench already picks two snapshots.

## Goal

Choosing two snapshots lists path changes in four groups: new, removed, confidence-band changed, and remediation status changed.

## Why

The drift workbench compares inventory properties. A reader who wants to know whether a public path appeared, disappeared, or changed band has to open each snapshot separately.

## Read first

- `archlucid-ui/src/app/(operator)/infrastructure/drift/page.tsx`
- The drift client that already selects two snapshot ids
- The persisted path read model under `ArchLucid.Application/InfraEvidence/SecureNowArchitect/`
- `docs/library/SECURENOW_ARCHITECT_PLANE.md`

## What to build

1. Branch `uu/18-snapshot-path-compare` from current `master`.
2. If a path-compare API already exists, call it from the drift page. If it does not, add a tenant-scoped read that loads persisted paths for the two snapshot ids already selected. Match paths by a stable signature the stored path already has, such as path kind plus ordered hop resource ids. Do not invent a signature from display labels alone.
3. Classify each matched or unmatched path:
   - New: present in the later snapshot only.
   - Removed: present in the earlier snapshot only.
   - Band changed: same signature, different `PathConfidenceBand`.
   - Remediation status changed: same signature, different remediation instance status when that status is already stored. If remediation status is not stored on the path, omit this group and say so.
4. Render the four groups on the drift page under the existing property diff. Each row shows the path summary already stored, the earlier band, and the later band.
5. Do not add a collector. Do not re-rank. Do not write to Azure. Empty groups say "None."
6. Cross-tenant snapshot ids return not found. Add a test that a path from another tenant is not listed.

## Acceptance criteria

- A later snapshot with one extra path lists it under New.
- A path whose band moves from Possible to Confirmed lists under Band changed.
- A path that is identical in both snapshots appears in none of the groups.
- The property-level drift table still renders.

## Constraints

- Before editing a tracked file, run `.\scripts\agent\check-working-tree-path.ps1 -Path '<path>'`. Stop on exit code 2.
- One class per file. No `ConfigureAwait(false)` in tests.
- Compile once: `.\scripts\ci\agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'`
- **Do not commit.**

## Verification

```powershell
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter FullyQualifiedName~PathSnapshotCompare
cd archlucid-ui
npx vitest run src/lib/infra-evidence/infra-evidence-drift-table-filter.test.ts
```

Add the new test name to the filter if you name the fixture differently. Run only those tests. Heartbeat the compile.

## Done when

Tests pass. Tell the owner to open drift for two snapshots and read New and Band changed. Wait for that look before any commit.
