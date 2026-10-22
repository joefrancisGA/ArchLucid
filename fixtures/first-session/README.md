# First-session observation fixtures

Copy templates into `artifacts/first-session/<cohort-label>/` before running [`docs/go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md`](../../docs/go-to-market/FIRST_SESSION_COGNITIVE_LOAD_OBSERVATION.md).

**Do not commit** customer-identifying content under `artifacts/`. Use pseudonymous participant labels only.

## Folder layout

```
<cohort-label>/
  sessions/
    session-01-notes.md
    session-02-notes.md
    session-03-notes.md
    session-01-dismissal-trigger.json   # optional, when D1–D7
  cohort-synthesis.md
```

## Quick start

```powershell
$cohort = "cohort-2026-06"
$root = "artifacts/first-session/$cohort"
New-Item -ItemType Directory -Force -Path "$root/sessions" | Out-Null
1..3 | ForEach-Object {
  Copy-Item fixtures/first-session/session-notes.template.md "$root/sessions/session-{0:D2}-notes.md" -f $_
}
Copy-Item fixtures/first-session/cohort-synthesis.template.md "$root/cohort-synthesis.md"
```
