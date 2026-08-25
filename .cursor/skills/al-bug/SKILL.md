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
4. **Stats** — `.\scripts\agent\al-bug-rolling-stats.ps1 -RecordHunt -HuntZoneId '<id>' -HuntOutcome hit|dry|seed-only -Rolling24h` (skip for `--status`). Ship `docs/library/AL_BUG_HUNT_RUN_LOG.jsonl` with the ledger. Report **Bugs found (24h)** and **Dry runs (24h)** in the result table.

`--status` prints the picker preview and stops. Each run is either a **thorough defect hunt** or a **seed hunt** — announce the kind immediately after the picker, even when other `/al-bug` messages are queued. A dry hunt (hunt-ready hypotheses tested with failing-repro attempts, no failing repro) updates the ledger and stops — do not invent another zone. A **seed hunt** (`seedHunt: true`) must say **This /al-bug run is a seed hunt**, read the zone files, promote or retire candidates, and prove any newly hunt-ready row in the same run; otherwise stop as seed-only and keep Kind `seed hunt` in the result table.

Queued follow-ups do **not** skip scoped tests, cheap-disproof, or failing-repro attempts.

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
- `docs/library/AL_BUG_HUNT_RUN_LOG.jsonl` — rolling hunt outcome log
- `scripts/agent/al-bug-pick-zone.ps1` — next-zone picker
- `scripts/agent/al-bug-rolling-stats.ps1` — record outcome + 24h yield preview
- `.cursor/rules/Agent-Working-Tree-Safety.mdc`
- `.cursor/rules/Git-Commit-Requires-Branch.mdc` — satisfied by default `master` target
