---
name: al-bug
description: >-
  Hunts a real code defect with a failing repro test, applies a minimal fix with
  regression coverage, and pushes to master via worktree when needed. Use when
  the user invokes /al-bug, asks to find fix and push a bug, or wants iterative
  topology orchestration defect hunting on master.
disable-model-invocation: true
---

# /al-bug — find, fix, push

Follow the full workflow in `.cursor/commands/al-bug.md`.

## Invoke

```text
/al-bug
/al-bug master
/al-bug "<hunt hint>"
/al-bug --find-only
```

Default push target: **`master`**.

## Quick workflow

1. **Find** — repro-first; failing test required before fixing
2. **Fix** — minimal diff + permanent regression test
3. **Ship** — `.\scripts\agent\al-bug-push-master.ps1` when main tree is dirty; else direct commit

## Hunt heuristics (topology orchestration)

Look for inconsistencies between:

| Component | Role |
| --- | --- |
| `AgentTopologyProposalMergeGate` | Filters proposals against inventoried graph |
| `AgentTopologyProposalGraphMerge` | Materializes nodes/edges for commit |
| `TopologyProposalRelationshipEdgeMapper` | Resolves relationship endpoints → node ids |
| `TopologyProposalRelationshipEndpointIndex` | Shared endpoint keys, claims, aliases |

Common defect shapes:

- Relationship survives merge gate but edge is not created in graph merge
- Renamed manifest labels not aliased to existing graph node ids
- Synthetic keys (`svc-{name}`, `ds-{name}`) missing for some node categories
- ARM / Terraform `SourceId` indexed in one layer but not another
- Agent-proposed graph nodes claimed in merge but excluded from alias resolution

## Scoped test command

```powershell
dotnet test ArchLucid.Application.Tests/ArchLucid.Application.Tests.csproj `
  --filter "FullyQualifiedName~AgentTopologyProposalMergeGateTests|FullyQualifiedName~AgentTopologyProposalGraphMergeTests|FullyQualifiedName~TopologyProposalRelationshipEdgeMapperTests"
```

## Push helper

```powershell
.\scripts\agent\al-bug-push-master.ps1 `
  -Paths @('path/to/changed.cs') `
  -CommitMessage 'Fix relationship alias resolution for renamed services.'
```

## Related

- `/al-defect` — operator-reported production defects (`PD-###`)
- `.cursor/rules/Agent-Working-Tree-Safety.mdc`
- `.cursor/rules/Git-Commit-Requires-Branch.mdc` — satisfied by default `master` target
