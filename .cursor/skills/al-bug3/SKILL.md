---
name: al-bug3
description: Hunt one defect in zone set 3 and push to bugsmash-3 (/al-bug3, alias /3)
disable-model-invocation: true
---

# /al-bug3 — zone set 3 (`/3`)

Follow `.cursor/skills/al-bug/workflow.md` with these bindings. They replace `bugsmash`, the index ledger, and the shared run log for this invocation.

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
.\scripts\agent\al-bug-zone-rotation.ps1 -Set 3 -PreviewPick -SkipGitPicker
.\scripts\agent\al-bug-pick-zone.ps1 -Set 3 -Preview
.\scripts\agent\al-bug-rolling-stats.ps1 -Set 3 -RecordHunt -HuntZoneId '<zoneId>' -HuntOutcome hit -Rolling24h
.\scripts\agent\al-bug-push-master.ps1 -TargetBranch bugsmash-3 -Paths @('<paths>') -CommitMessage @'
One-sentence why focused on the defect.

Private beta: One or two sentences on what changes for invited operators when this
fix is on the RC35 / private-beta line.

'@
```

When the user did **not** name a hunt hint, run **`al-bug-zone-rotation.ps1 -Set 3 -PreviewPick -SkipGitPicker`** instead of calling the picker alone. If JSON **`shouldRotate`** is true, hunt **`pickResult.zoneId`** (the picker already received **`-AvoidZoneId`**). If **`shouldRotate`** is false, hunt the returned **`pickResult`** zone. Say in chat when rotation fired (**`reason`** field) so Joseph can see why the zone changed.

Add `-Hint '<zone>'` to rotation (or the picker) when the user named a zone in this set. Hints disable automatic avoidance. Pass `-Refresh` when the user passed `--refresh`.

## Rules

- Hunt only the zone `-Set 3` returns. A hint for another set is an error.
- Edit `docs/library/AL_BUG_HUNT_LEDGER_3.md` only. Do not prepend hunt notes to `docs/library/AL_BUG_HUNT_LEDGER.md`, and do not edit the other set ledgers.
- Record the outcome with `-Set 3` so it lands in `docs/library/AL_BUG_HUNT_RUN_LOG_3.jsonl`.
- Push `bugsmash-3`. The first sync creates that branch from `origin/bugsmash` when the remote set branch does not exist yet.
- `/al-bug1`, `/al-bug2`, `/al-bug3`, and `/al-bug4` can run at the same time. Each set has its own ledger, run log, and branch.
- Do not run unscoped `/al-bug` beside a set command. Unscoped `/al-bug` still pushes `bugsmash`.
- On every **hit**, include the **Private beta:** paragraph in the commit body, Phase 4 result table, and this set's ledger hunt note (`workflow.md` § Private beta impact).

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
