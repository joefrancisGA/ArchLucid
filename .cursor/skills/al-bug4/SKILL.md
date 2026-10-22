---
name: al-bug4
description: /al-bug4 — zone set 4
disable-model-invocation: true
---

---
description: Hunt one defect in zone set 4 and push to bugsmash-4
---

# /al-bug4 — zone set 4

Follow `.cursor/commands/al-bug.md` with these bindings. They replace `bugsmash`, the index ledger, and the shared run log for this invocation.

| Binding | Value |
| --- | --- |
| Set | 4 — Core, host, persistence, and extraction |
| Branch | `bugsmash-4` |
| Ledger | `docs/library/AL_BUG_HUNT_LEDGER_4.md` |
| Run log | `docs/library/AL_BUG_HUNT_RUN_LOG_4.jsonl` |
| Catalog | `scripts/agent/al-bug-zone-sets.json` |

## Commands

```powershell
.\scripts\agent\al-bug-sync-branch.ps1 -TargetBranch bugsmash-4
.\scripts\agent\al-bug-pick-zone.ps1 -Set 4 -Preview
.\scripts\agent\al-bug-rolling-stats.ps1 -Set 4 -RecordHunt -HuntZoneId '<zoneId>' -HuntOutcome hit -Rolling24h
.\scripts\agent\al-bug-push-master.ps1 -TargetBranch bugsmash-4 -Paths @('<paths>') -CommitMessage @'
One-sentence why focused on the defect.

'@
```

Add `-Hint '<zone>'` to the picker when the user named a zone in this set. Pass `-Refresh` when the user passed `--refresh`.

## Rules

- Hunt only the zone `-Set 4` returns. A hint for another set is an error.
- Edit `docs/library/AL_BUG_HUNT_LEDGER_4.md` only. Do not prepend hunt notes to `docs/library/AL_BUG_HUNT_LEDGER.md`, and do not edit the other set ledgers.
- Record the outcome with `-Set 4` so it lands in `docs/library/AL_BUG_HUNT_RUN_LOG_4.jsonl`.
- Push `bugsmash-4`. The first sync creates that branch from `origin/bugsmash` when the remote set branch does not exist yet.
- `/al-bug1`, `/al-bug2`, `/al-bug3`, and `/al-bug4` can run at the same time. Each set has its own ledger, run log, and branch.
- Do not run unscoped `/al-bug` beside a set command. Unscoped `/al-bug` still pushes `bugsmash`.

## Zones

- `weekly-digest-email`
- `outbound-webhook-dry-run`
- `worker-host`
- `host-core-jobs`
- `security-analyzers`
- `retrieval`
- `archlucid-core`
- `core-azure-extractor`
- `core-configuration-summary`
- `core-findings-advice`
- `core-requests-constraints`
- `core-authority-runs`
- `core-tenancy-commercial`
- `core-safety-network`
- `core-costing`
- `core-explanation-json`
- `context-ingestion`
- `knowledge-graph-provenance`
- `notifications-pipeline`
- `artifact-synthesis`
- `host-composition`
- `cloud-extractors`
- `host-core-coordination`
- `chatops-delivery`
- `host-infra-evidence-composition`
