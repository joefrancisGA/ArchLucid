---
name: al-bug-api
description: >-
  Launches a Cursor Cloud Agent to run the /al-bug hunt-fix-ship workflow on
  master. Use when the user invokes /al-bug-api or wants remote bug hunting via
  the Cloud Agents API instead of a local /al-bug run.
disable-model-invocation: true
---

# /al-bug-api — cloud bug hunt

Follow `.cursor/commands/al-bug-api.md`.

## Invoke

```text
/al-bug-api
/al-bug-api master
/al-bug-api "<hunt hint>"
/al-bug-api --find-only
/al-bug-api --status
/al-bug-api --refresh
/al-bug-api --wait
/al-bug-api --loop
```

## Quick workflow

1. **`--status`** → `.\scripts\Invoke-AlBugApi.ps1 -Status` (local picker only; stop).
2. **`--loop`** → `.\scripts\Invoke-AlBugApi.ps1 -Loop` (sequential hunts; Ctrl+C to stop).
3. **`--wait`** → launch + poll until terminal status.
4. **Otherwise** → `.\scripts\Invoke-AlBugApi.ps1` with parsed flags; return agent URL.
5. Do **not** hunt locally unless the user also asked for `/al-bug`.

Cloud agent follows `.cursor/commands/al-bug.md` with `workOnCurrentBranch=true` on `master` (or override).

## Related

- `/al-bug` — local hunt loop
- `/al-api` — generic cloud task launcher
- `scripts/Invoke-AlBugApi.ps1` — bug-hunt prompt + API call
- `scripts/Wait-AlApiRun.ps1` — run status polling
