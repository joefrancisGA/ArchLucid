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

`--status` prints the picker preview and stops. A dry hunt (hunt-ready hypotheses tested, no failing repro) updates the ledger and stops — do not invent another zone. A **seed hunt** (`seedHunt: true`) reads the zone files, promotes or retires candidates, and may prove one hunt-ready row in the same run.

## Hunt the picked zone only

Do **not** LLM-rank zones or default to topology-first. The picker scores `docs/library/AL_BUG_HUNT_LEDGER.md` with explore/exploit (shorter mean hunts-per-bug once sampled; exploration bonus for untried zones). **Candidate** rows do not add score; **hunt-ready** count is a small tie-break; **precision** (`proven / (proven + invalid)`) is a small bonus after two classified attempts.

Use the JSON `paths`, `openHypotheses`, `huntReadyHypotheses`, `candidateHypotheses`, `seedHunt`, and `testFilter`.

**Hunt-ready bar:** locus + input + wrong outcome + mechanism in *these* files. Harm-class one-liners (“cross-tenant leak”, “stale cache”) stay `(candidate)` until the files show the prerequisite. Cheap-disproof a row (locus exists, not already tested, prerequisite present) before writing a repro.

Ledger tags: `(candidate)`, `(hunt-ready)`, `(proven)`, `(invalid)`, `(valid-no-repro)`. Bare `[x]` counts as proven — do not tick misses that way.

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
