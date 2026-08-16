---
name: al-bug
description: >-
  Hunts a real code defect with a failing repro test, applies a minimal fix with
  regression coverage, and pushes to master via worktree when needed. Use when
  the user invokes /al-bug, asks to find fix and push a bug, or wants iterative
  ledger-ranked defect hunting on master.
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
/al-bug --status
/al-bug --refresh
```

Default push target: **`master`**.

## Quick workflow

0. **Target** — `.\scripts\agent\al-bug-pick-zone.ps1 -Preview` (add `-Hint` / `-Refresh` as applicable). Hunt **only** that zone.
1. **Find** — repro-first; failing test required before fixing
2. **Fix** — minimal diff + permanent regression test
3. **Ship** — `.\scripts\agent\al-bug-push-master.ps1` when main tree is dirty; else direct commit. Always update `docs/library/AL_BUG_HUNT_LEDGER.md`.

`--status` prints the picker preview and stops. A dry hunt (listed hypotheses tested, no failing repro) updates the ledger and stops — do not invent another zone.

## Hunt the picked zone only

Do **not** LLM-rank zones or default to topology-first. The picker scores `docs/library/AL_BUG_HUNT_LEDGER.md` with explore/exploit (shorter mean hunts-per-bug once sampled; exploration bonus for untried zones). Use the JSON `paths`, `openHypotheses`, and `testFilter`.

Topology orchestration remains a **high-yield zone** (`topology-proposal-merge`) after it has been sampled, not a global default. Hunt the rest of the catalog when those zones are still untried. Typical defect shapes there:

| Component | Role |
| --- | --- |
| `AgentTopologyProposalMergeGate` | Filters proposals against inventoried graph |
| `AgentTopologyProposalGraphMerge` | Materializes nodes/edges for commit |
| `TopologyProposalRelationshipEdgeMapper` | Resolves relationship endpoints → node ids |
| `TopologyProposalRelationshipEndpointIndex` | Shared endpoint keys, claims, aliases |

- Relationship survives merge gate but edge is not created in graph merge
- Renamed manifest labels not aliased to existing graph node ids
- Synthetic keys (`svc-{name}`, `ds-{name}`) missing for some node categories
- ARM / Terraform `SourceId` indexed in one layer but not another
- Agent-proposed graph nodes claimed in merge but excluded from alias resolution

## Scoped test command

Prefer the picker’s `testFilter`. Example for the topology zone:

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
- `docs/library/AL_BUG_HUNT_LEDGER.md` — zone yield and exhaustion
- `scripts/agent/al-bug-pick-zone.ps1` — next-zone picker
- `.cursor/rules/Agent-Working-Tree-Safety.mdc`
- `.cursor/rules/Git-Commit-Requires-Branch.mdc` — satisfied by default `master` target
