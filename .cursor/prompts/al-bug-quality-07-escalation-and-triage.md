# ABQ-07 — Same-file escalation and sequential-run triage hold

**Depends on ABQ-06** (cooldown JSON + 24h warning). Do not re-tune the speed formula here.

## Goal

Three or more `/al-bug` **hits** that touch the same production file within seven days force that file’s zone to `cooling`, print an escalation banner, and forbid another instance-list fix to that file from `/al-bug`. Sequential hunts (`al-bug-sequential-run.ps1`) must **not** auto-push low-severity hits; they stop for human triage.

## Why

`AzureExtractorSensitivePropertyRedactor.cs` absorbed dozens of “hits” in two days, each one prefix. The sequential-100 runner optimized the headline KPI **Bugs found (24h)**. For professional-architect quality, a streak on one file is evidence the **mechanism** is wrong (ABQ-01–04), not that the product is getting healthier.

## Context

- `scripts/agent/al-bug-sequential-run.ps1`
- `scripts/agent/al-bug-push-master.ps1` — do not break worktree push; add a **gate** the sequential runner and command can invoke
- `.cursor/commands/al-bug.md` Phase 3 — hold rule
- `docs/library/AL_BUG_SEQUENTIAL_100_LOG.md` — header note only (do not rewrite history)
- Optional helper: `scripts/agent/al-bug-escalation.ps1` if keeping sequential-run small is cleaner (one new script is OK)

Hits do not currently record **paths** in `AL_BUG_HUNT_RUN_LOG.jsonl` (only `at`, `zoneId`, `outcome`). You may extend the JSON with optional `paths` / `severity` fields **without** rewriting old lines. Escalation for historical treadmill files can also use `git log origin/bugsmash --since=7 days ago -- <file>` as a fallback when jsonl lacks paths.

## What to build

1. **Escalation detector:** given zone paths + last 7 days of bugsmash commits (and jsonl `paths` when present), if the same production file (not `*Tests*`) appears in ≥ 3 hunt-fix commits, picker JSON includes `escalatedFiles: [...]` and the zone is ineligible as if `cooling`.
2. Command Phase 2/3: if the implicated file is in `escalatedFiles`, **do not ship** an allowlist/phrase-list patch. Print: mechanism is wrong; run ABQ-01–04 or a design fix; record the hunt as dry/invalid rather than another hit on that file.
3. Sequential runner `-CompleteHunt` with `hit`: require `-Severity high|medium|low` (default medium if omitted for compat). If `low`, **do not** instruct a push; log `held-for-triage` in the sequential log and skip advancing as a shipped hit. High/medium may ship only when ABQ-05 reachability is cited in the commit body.
4. Rolling stats: count `held-for-triage` separately from `hit` if you add the outcome; otherwise keep sequential holds out of `bugsFound24h`.
5. Tests: Pester for the detector (fixture commits are hard — prefer a `-GitLogText` or fake jsonl with `paths`). Sequential script: a unit-testable function `Test-AlBugShouldHoldHit`.

```powershell
Invoke-Pester -Path 'scripts/tests/AlBugPickZone.Tests.ps1'
Invoke-Pester -Path 'scripts/tests/AlBugRollingStats.Tests.ps1'
```

Add `scripts/tests/AlBugEscalation.Tests.ps1` if you create a helper.

## Acceptance criteria

- Preview JSON can show `escalatedFiles` for a fixture.
- Sequential low-severity hit does not increment 24h bugs-found.
- Command text tells agents not to push instance-list fixes to an escalated file.
- Old jsonl lines without `paths` still parse.

## Constraints

- Do not auto-open GitHub issues.
- Do not invent `TB-###` / `PD-###` ids.
- Do not disable `/al-bug` entirely.
- Do not run `/al-bug`.
- Working-tree safety on every tracked path you edit.
