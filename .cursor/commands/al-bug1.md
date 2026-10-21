---
description: Hunt one defect in zone set 1 and push to bugsmash-1
---

# /al-bug1 — zone set 1

Follow `.cursor/commands/al-bug.md` with these bindings. They replace `bugsmash`, the index ledger, and the shared run log for this invocation.

| Binding | Value |
| --- | --- |
| Set | 1 — Orchestration and topology |
| Branch | `bugsmash-1` |
| Ledger | `docs/library/AL_BUG_HUNT_LEDGER_1.md` |
| Run log | `docs/library/AL_BUG_HUNT_RUN_LOG_1.jsonl` |
| Catalog | `scripts/agent/al-bug-zone-sets.json` |

## Commands

```powershell
.\scripts\agent\al-bug-sync-branch.ps1 -TargetBranch bugsmash-1
.\scripts\agent\al-bug-pick-zone.ps1 -Set 1 -Preview
.\scripts\agent\al-bug-rolling-stats.ps1 -Set 1 -RecordHunt -HuntZoneId '<zoneId>' -HuntOutcome hit -Rolling24h
.\scripts\agent\al-bug-push-master.ps1 -TargetBranch bugsmash-1 -Paths @('<paths>') -CommitMessage @'
One-sentence why focused on the defect.

'@
```

Add `-Hint '<zone>'` to the picker when the user named a zone in this set. Pass `-Refresh` when the user passed `--refresh`.

## Rules

- Hunt only the zone `-Set 1` returns. A hint for another set is an error.
- Edit `docs/library/AL_BUG_HUNT_LEDGER_1.md` only. Do not prepend hunt notes to `docs/library/AL_BUG_HUNT_LEDGER.md`, and do not edit the other set ledgers.
- Record the outcome with `-Set 1` so it lands in `docs/library/AL_BUG_HUNT_RUN_LOG_1.jsonl`.
- Push `bugsmash-1`. The first sync creates that branch from `origin/bugsmash` when the remote set branch does not exist yet.
- `/al-bug1`, `/al-bug2`, `/al-bug3`, and `/al-bug4` can run at the same time. Each set has its own ledger, run log, and branch.
- Do not run unscoped `/al-bug` beside a set command. Unscoped `/al-bug` still pushes `bugsmash`.

## Zones

- `topology-proposal-merge`
- `arm-terraform-source-ids`
- `commit-output-integrity`
- `content-safety-admission`
- `storage-vs-data-category`
- `authority-pipeline-payload`
- `technology-ledger-merge`
- `orchestrator-transient-retry`
- `alert-simulation`
- `architecture-recommendation`
- `extraction-router`
- `agent-runtime-safety`
- `application-analysis`
- `application-pilots`
- `agent-runtime-evaluation`
- `decisioning`
- `application-agents`
- `capabilities-cost-mcp`
- `quick-scan-distributed-concurrency`
- `run-execute-ownership`
- `architecture-intelligence-orchestrator`
