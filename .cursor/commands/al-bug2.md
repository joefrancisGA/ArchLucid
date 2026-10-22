---
description: Hunt one defect in zone set 2 and push to bugsmash-2
---

# /al-bug2 — zone set 2

Follow `.cursor/commands/al-bug.md` with these bindings. They replace `bugsmash`, the index ledger, and the shared run log for this invocation.

| Binding | Value |
| --- | --- |
| Set | 2 — API, identity, tenancy, and governance |
| Branch | `bugsmash-2` |
| Ledger | `docs/library/AL_BUG_HUNT_LEDGER_2.md` |
| Run log | `docs/library/AL_BUG_HUNT_RUN_LOG_2.jsonl` |
| Catalog | `scripts/agent/al-bug-zone-sets.json` |

## Commands

```powershell
.\scripts\agent\al-bug-sync-branch.ps1 -TargetBranch bugsmash-2
.\scripts\agent\al-bug-pick-zone.ps1 -Set 2 -Preview
.\scripts\agent\al-bug-rolling-stats.ps1 -Set 2 -RecordHunt -HuntZoneId '<zoneId>' -HuntOutcome hit -Rolling24h
.\scripts\agent\al-bug-push-master.ps1 -TargetBranch bugsmash-2 -Paths @('<paths>') -CommitMessage @'
One-sentence why focused on the defect.

'@
```

Add `-Hint '<zone>'` to the picker when the user named a zone in this set. Pass `-Refresh` when the user passed `--refresh`.

## Rules

- Hunt only the zone `-Set 2` returns. A hint for another set is an error.
- Edit `docs/library/AL_BUG_HUNT_LEDGER_2.md` only. Do not prepend hunt notes to `docs/library/AL_BUG_HUNT_LEDGER.md`, and do not edit the other set ledgers.
- Record the outcome with `-Set 2` so it lands in `docs/library/AL_BUG_HUNT_RUN_LOG_2.jsonl`.
- Push `bugsmash-2`. The first sync creates that branch from `origin/bugsmash` when the remote set branch does not exist yet.
- `/al-bug1`, `/al-bug2`, `/al-bug3`, and `/al-bug4` can run at the same time. Each set has its own ledger, run log, and branch.
- Do not run unscoped `/al-bug` beside a set command. Unscoped `/al-bug` still pushes `bugsmash`.

## Zones

- `tenant-settings-sql`
- `email-otp-auth`
- `auth-return-path`
- `tenant-erasure`
- `tenant-scoped-analyzer`
- `sql-run-repository`
- `finding-inspect-sql`
- `llm-wallet`
- `finding-disposition`
- `review-recurrence`
- `scim-users`
- `identity-provider-config`
- `persistence-billing-stripe`
- `billing-webhooks`
- `api-key-auth`
- `scope-binding-middleware`
- `saml-jwt-bearer`
- `tenant-data-export`
- `itsm-inbound-webhooks`
- `application-billing-logic`
- `persistence-identity`
- `api-authority-admin-controllers`
- `api-governance-tenancy-controllers`
- `api-policy-packs`
- `api-governance-stickiness`
- `api-tenancy-workspaces`
- `application-governance-policy`
- `application-tenancy-lifecycle`
- `api-request-null-collection-elements`
