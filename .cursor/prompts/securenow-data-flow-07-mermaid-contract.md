# SN-DF-07 — Data Flow mermaid contract from inventory snapshots

**Wave:** SecureNow data flow (**SN-DF**). **Depends on:** SN-DF-03, SN-DF-05. **Do not** implement SN-DF-08.

Do not implement from the wave index. Implement only *What to build*.

## Goal

`InfraEvidenceSnapshotMermaidService` (or equivalent) tests lock **mode=dataFlow**: Succeeded, mermaid present, expected node labels (factory + SQL and/or external source), honesty sentence, **not** Failed, **not** empty when ADF+store fixtures exist.

## Why

IE-ND-02 / IE-ID-02 / IE-DD-02 exist so category/compile cannot drift. Data Flow needs the same ratchet.

## Context

- `ArchLucid.Application.Tests` mermaid service tests for network/identity/data
- `docs/architecture/INFRA_EVIDENCE_DATA_DIAGRAM_COMPOSER_PROMPTS.md` IE-DD-02 pattern — **copy the test shape**, do not re-run IE-DD
- SN-DF-03 MVP fixture (SAP external + ADF + SQL + writes-to)

## What to build

1. Snapshot-shaped graph or inventory rows → mermaid `mode=dataFlow`.
2. Assert status Succeeded (or honest empty if fixture has no data-flow nodes — then use a fixture that **has** ADF+SQL).
3. Assert mermaid contains factory name, SQL or storage label, Reads from or Writes to (or Connected to if directional companions absent — prefer a fixture **with** directional edges).
4. Assert mermaid does not contain a VNet name from the same fixture.
5. Optional: `mode=dataArchitecture` node-count assertion if SN-DF-06 already merged; skip if 06 not on the branch.
6. Do not pre-stamp `Category` to hide IE-DD-01; Data Flow uses the stage catalog (ARM type), so SQL can appear even if Data mode is still broken.

## Acceptance criteria

- CI fails if Data Flow compile drops ADF arrows or reintroduces VNet boxes on the MVP fixture.
- Data/Network contracts still pass.

## Constraints

- Working-tree safety. Do not flatten rewrite. Do not raise IE-17 limits.
- Stage only this prompt’s paths. **No `git add -A`.**

## Verification

```bash
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj --filter 'FullyQualifiedName~InfraEvidenceSnapshotMermaidServiceTests'
pwsh -NoProfile -File scripts/ci/agent-compile-check.ps1 -ProjectPath 'ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj'
```

Heartbeat every 8s if >15s.

## Done when

- One test name a reviewer can grep that proves Data Flow is not Data mode.
