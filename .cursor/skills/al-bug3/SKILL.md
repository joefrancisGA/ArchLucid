---
name: al-bug3
description: /al-bug3 — zone set 3
disable-model-invocation: true
---

---
description: Hunt one defect in zone set 3 and push to bugsmash-3
---

# /al-bug3 — zone set 3

Follow `.cursor/commands/al-bug.md` with these bindings. They replace `bugsmash`, the index ledger, and the shared run log for this invocation.

| Binding | Value |
| --- | --- |
| Set | 3 — UI and CLI |
| Branch | `bugsmash-3` |
| Ledger | `docs/library/AL_BUG_HUNT_LEDGER_3.md` |
| Run log | `docs/library/AL_BUG_HUNT_RUN_LOG_3.jsonl` |
| Catalog | `scripts/agent/al-bug-zone-sets.json` |

## Commands

```powershell
.\scripts\agent\al-bug-sync-branch.ps1 -TargetBranch bugsmash-3
.\scripts\agent\al-bug-pick-zone.ps1 -Set 3 -Preview
.\scripts\agent\al-bug-rolling-stats.ps1 -Set 3 -RecordHunt -HuntZoneId '<zoneId>' -HuntOutcome hit -Rolling24h
.\scripts\agent\al-bug-push-master.ps1 -TargetBranch bugsmash-3 -Paths @('<paths>') -CommitMessage @'
One-sentence why focused on the defect.

'@
```

Add `-Hint '<zone>'` to the picker when the user named a zone in this set. Pass `-Refresh` when the user passed `--refresh`.

## Rules

- Hunt only the zone `-Set 3` returns. A hint for another set is an error.
- Edit `docs/library/AL_BUG_HUNT_LEDGER_3.md` only. Do not prepend hunt notes to `docs/library/AL_BUG_HUNT_LEDGER.md`, and do not edit the other set ledgers.
- Record the outcome with `-Set 3` so it lands in `docs/library/AL_BUG_HUNT_RUN_LOG_3.jsonl`.
- Push `bugsmash-3`. The first sync creates that branch from `origin/bugsmash` when the remote set branch does not exist yet.
- `/al-bug1`, `/al-bug2`, `/al-bug3`, and `/al-bug4` can run at the same time. Each set has its own ledger, run log, and branch.
- Do not run unscoped `/al-bug` beside a set command. Unscoped `/al-bug` still pushes `bugsmash`.

## Zones

- `ui-form-validation`
- `cli-tenant-isolation`
- `cli-draft-new`
- `cli-terraform-evidence`
- `ui-runs-list`
- `ui-auth-callback`
- `ui-help-docs`
- `ui-webhooks-settings`
- `ui-host-gate`
- `ui-architecture-intelligence`
- `ui-auth-proxy`
- `ui-oidc`
- `archlucid-contracts`
- `ui-operator-routes`
- `ui-marketing-surfaces`
- `ui-operator-lib`
- `ui-review-detail-workspace`
- `ui-review-intake-wizards`
- `ui-governance-findings-queue`
- `ui-infra-resource-hub`
- `ui-claim-discipline-policy`
- `securenow-question-queue`
- `infra-evidence-diagrams`
- `ui-architecture-diagram`
