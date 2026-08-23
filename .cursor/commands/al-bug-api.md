---
description: Launch a Cloud Agent to run the /al-bug hunt-fix-ship workflow on master
---

# /al-bug-api — Cloud Agent bug hunt (`/al-bug` via API)

Starts a **Cursor Cloud Agent** (Composer 2.5 standard, not Fast) that follows the full **`/al-bug`** workflow in `.cursor/commands/al-bug.md`. The local chat agent does **not** hunt bugs — it only launches the cloud run and returns the agent URL.

Distinct from **`/al-bug`** (local hunt loop) and **`/al-api`** (generic cloud task launcher).

**Default git target:** **`master`** (cloud agent pushes with `workOnCurrentBranch=true`).

---

## Arguments

Same surface as `/al-bug`, except **`--status`** is local-only (no cloud launch):

```text
/al-bug-api
/al-bug-api master
/al-bug-api "<optional hunt hint>"
/al-bug-api master "<optional hunt hint>"
/al-bug-api --find-only
/al-bug-api master --find-only
/al-bug-api --status
/al-bug-api --refresh
/al-bug-api --wait
/al-bug-api --loop
/al-bug-api --loop --max-hunts 10
```

- **`master`** (optional) — explicit branch target for the cloud agent.
- **`"<optional hunt hint>"`** — pin a ledger zone by id or alias.
- **`--find-only`** — cloud agent stops after Phase 1 (repro only).
- **`--status`** — run `al-bug-pick-zone.ps1 -Preview` **locally** and stop (no API call).
- **`--refresh`** — pass `-Refresh` to the picker (local `--status` or embedded in cloud prompt).
- **`--wait`** — after launch, poll until the run finishes and print final status.
- **`--loop`** — launch hunts **sequentially**; wait for each run before the next. Stop with Ctrl+C.
- **`--max-hunts N`** — with `--loop`, stop after N hunts (omit for unlimited).
- **Optional screenshot** — attach an image; save to `.cursor/tmp/` and pass `-ImagePath` to the script.

---

## Steps

1. Confirm config exists at `.cursor/al-api.config.json`.
   - If missing, tell the user to copy `.cursor/al-api.config.example.json` → `.cursor/al-api.config.json` and set `apiKey` (or set `CURSOR_API_KEY`).
2. Parse flags from the user message (`--status`, `--find-only`, `--refresh`, branch, hint).
3. If **`--status`**, run locally from repo root:

```powershell
.\scripts\Invoke-AlBugApi.ps1 -Status [-Hint '<hint>'] [-Refresh]
```

Print the picker preview and **stop** (no cloud agent).

4. Otherwise, if an image was attached:
   - Save it under `.cursor/tmp/al-bug-api-screenshot.png` (or matching extension).
   - Pass the absolute path to the script.
5. Launch the cloud bug hunt from repo root:

```powershell
.\scripts\Invoke-AlBugApi.ps1 `
  [-TargetBranch master] `
  [-Hint '<hint>'] `
  [-FindOnly] `
  [-Refresh] `
  [-Wait] `
  [-Loop] `
  [-MaxHunts 0] `
  [-PollIntervalSeconds 30] `
  [-ImagePath '<absolute path>']
```

**Continuous sequential hunts:**

```powershell
.\scripts\Invoke-AlBugApi.ps1 -Loop
.\scripts\Invoke-AlBugApi.ps1 -Loop -MaxHunts 10 -PollIntervalSeconds 20
```

Stop with **Ctrl+C**.

6. Reply with:
   - Agent URL (clickable)
   - Agent ID and run ID
   - Confirmation: `composer-2.5`, `fast=false`, `workOnCurrentBranch=true`, target branch
7. Delete any temp screenshot under `.cursor/tmp/` after the script succeeds.

---

## Error handling

- If the API returns an error, show the response body and stop.
- Do **not** fall back to starting a Cloud Agent from the UI (may use Fast mode).
- Do **not** run the local `/al-bug` hunt in this chat unless the user explicitly asks.
- Do **not** modify product code in this invocation.

---

## Example

```text
/al-bug-api master "topology proposal graph merge"
```

```powershell
.\scripts\Invoke-AlBugApi.ps1 -TargetBranch master -Hint 'topology proposal graph merge'
```

Then return the agent URL from the script output.

---

## Canonical files

- `.cursor/commands/al-bug-api.md` — this workflow
- `.cursor/commands/al-bug.md` — workflow the cloud agent must follow
- `scripts/Invoke-AlBugApi.ps1` — prompt builder + launcher (`-Wait`, `-Loop`)
- `scripts/Wait-AlApiRun.ps1` — poll run until terminal status
- `scripts/Invoke-AlApi.ps1` — shared Cloud Agents API client
- `.cursor/al-api.config.example.json` — config template
