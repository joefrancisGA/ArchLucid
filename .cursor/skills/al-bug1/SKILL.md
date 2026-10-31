---
name: al-bug1
description: Hunt one defect in zone set 1 and push to bugsmash-1 (/al-bug1, alias /1)
disable-model-invocation: true
---

# /al-bug1 — zone set 1 (`/1`)

Follow `.cursor/skills/al-bug/workflow.md` with these bindings. They replace `bugsmash`, the index ledger, and the shared run log for this invocation.

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
.\scripts\agent\al-bug-zone-rotation.ps1 -Set 1 -PreviewPick -SkipGitPicker
.\scripts\agent\al-bug-pick-zone.ps1 -Set 1 -Preview
.\scripts\agent\al-bug-rolling-stats.ps1 -Set 1 -RecordHunt -HuntZoneId '<zoneId>' -HuntOutcome hit -Rolling24h
.\scripts\agent\al-bug-push-master.ps1 -TargetBranch bugsmash-1 -Paths @('<paths>') -CommitMessage @'
One-sentence why focused on the defect.

Private beta: One or two sentences on what changes for invited operators when this
fix is on the RC35 / private-beta line.

'@
```

When the user did **not** name a hunt hint, run **`al-bug-zone-rotation.ps1 -Set 1 -PreviewPick -SkipGitPicker`** instead of calling the picker alone. If JSON **`shouldRotate`** is true, hunt **`pickResult.zoneId`** (the picker already received **`-AvoidZoneId`**). If **`shouldRotate`** is false, hunt the returned **`pickResult`** zone. Say in chat when rotation fired (**`reason`** field) so Joseph can see why the zone changed.

Add `-Hint '<zone>'` to rotation (or the picker) when the user named a zone in this set. Hints disable automatic avoidance. Pass `-Refresh` when the user passed `--refresh`.

## Rules

- Hunt only the zone `-Set 1` returns. A hint for another set is an error.
- Edit `docs/library/AL_BUG_HUNT_LEDGER_1.md` only. Do not prepend hunt notes to `docs/library/AL_BUG_HUNT_LEDGER.md`, and do not edit the other set ledgers.
- Record the outcome with `-Set 1` so it lands in `docs/library/AL_BUG_HUNT_RUN_LOG_1.jsonl`.
- Push `bugsmash-1`. The first sync creates that branch from `origin/bugsmash` when the remote set branch does not exist yet.
- `/al-bug1`, `/al-bug2`, `/al-bug3`, and `/al-bug4` can run at the same time. Each set has its own ledger, run log, and branch.
- Do not run unscoped `/al-bug` beside a set command. Unscoped `/al-bug` still pushes `bugsmash`.
- On every **hit**, include the **Private beta:** paragraph in the commit body, Phase 4 result table, and this set's ledger hunt note (`workflow.md` § Private beta impact).

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
