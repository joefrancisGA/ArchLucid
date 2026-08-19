# Second-review habit-loop fixtures

Copy templates into `artifacts/second-review/<cohort-label>/` before running [`docs/library/REPEAT_REVIEW_LOOP.md#6-week-execution-board`](../../docs/library/REPEAT_REVIEW_LOOP.md#6-week-execution-board) (`SECOND_REVIEW_HABIT_LOOP_VALIDATION.md` alias).

**Do not commit** customer-identifying content under `artifacts/`.

## Folder layout

```
<cohort-label>/
  execution-board.md
  accounts/
    account-01.md
    account-02.md
    account-03.md
  digests/
    week-02-digest.md
    week-03-digest.md
    week-04-digest.md
    week-05-digest.md
```

## Quick start

```powershell
$cohort = "cohort-2026-06"
$root = "artifacts/second-review/$cohort"
New-Item -ItemType Directory -Force -Path "$root/accounts","$root/digests" | Out-Null
Copy-Item fixtures/second-review/execution-board.template.md "$root/execution-board.md"
1..3 | ForEach-Object {
  Copy-Item fixtures/second-review/account-tracker.template.md "$root/accounts/account-{0:D2}.md" -f $_
}
```
