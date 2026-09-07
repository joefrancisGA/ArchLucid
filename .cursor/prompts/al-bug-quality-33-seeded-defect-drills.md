# ABQ-33 — Seeded-defect drills (measure hunt-loop sensitivity)

**After ABQ-05/20/25 (shipped).** Do **not** run `/al-bug` during this prompt’s implementation. Do not raise Stryker `thresholds.break`. Do not hunt product bugs to pad yield.

## Goal

A **drill harness** can inject **one known defect** on a throwaway branch (or in a worktree), then record whether a **documented** `/al-bug` procedure would be *in a position* to find it (picker picks the zone, seed list contains a matching locus, revert-verifier / mutant still survives). This measures **loop sensitivity**, not self-reported `bugs-found`.

## Why

ABQ-16/19/20/25 make yield, escapes, guards, and kill-rate visible. None ask: “if we break this guard, does the hunt loop notice within N runs?” That is the only test of the picker + seed + 1.1b bar as a **system**. Running `/al-bug` to implement the harness would contaminate the run log and Goodhart the metric.

## Context

- `.cursor/commands/al-bug.md` — kinds, 1.1b, do not run Stryker during hunt
- `scripts/agent/al-bug-pick-zone.ps1` — `-Preview` / `--status` equivalent
- `scripts/agent/al-bug-verify-proven-revert.py` — production hunk revert (inverse: **inject** a hunk)
- `scripts/agent/al-bug-seed-from-analyzers.ps1` / ABQ-26 mutant seeder — candidate coverage
- Default hunt target `bugsmash` — **drills must not push to `bugsmash` or `master`**
- `docs/library/AL_BUG_HUNT_RUN_LOG.jsonl` — do **not** append drill hunts to the production run log (use a separate `docs/library/AL_BUG_DRILL_LOG.jsonl` or `--run-log` override)

Known-defect sources (pick **one** for v1):

- A checked-in **patch fixture** that reverts a small production guard (boolean identity, redaction token, tenant `WHERE`) — inverse of ABQ-20.
- A **surviving mutant** description from a fixture `mutation-report.json` (ABQ-26) applied as a text edit.

## What to build

1. **`scripts/agent/al-bug-seeded-defect-drill.ps1`** (or Python):

   - `-FixturePath` (unified diff or JSON `{ path, old, new, zoneId, expectedClass }`).
   - `-Worktree` / temp dir: `git worktree add` (never `git checkout` the agent branch to the drill SHA). Always remove the worktree in `finally`.
   - Apply the fixture. Run **picker** `-Preview` with `--run-log` pointing at an empty or fixture log so production JSONL is untouched. Assert `picked.zoneId` equals fixture `zoneId` **or** record `picker-miss`.
   - Optionally run analyzer/mutant seeder `-Preview` in the worktree; record `seed-hit` if a candidate path+line matches the fixture.
   - Do **not** invoke `/al-bug`. Do **not** commit. Do **not** push.
   - Write one JSONL line to the **drill** log: `{ at, fixture, zoneId, pickerHit, seedHit, notes }`.

2. **One fixture** in `scripts/tests/fixtures/al-bug-drills/` that breaks a **tiny**, already-tested guard (e.g. comment out a single `JsonBooleanStringReader` reject — **only inside the worktree**). The unit test applies it to a **copy** of a snippet file, not to Core on the agent branch.

3. **Docs:** ledger How-to / command FAQ: drills are offline; they do not count as hunts; they must not land on `bugsmash`. Owner may run the harness periodically; agents implementing **this** prompt must not start a hunt loop.

4. **CI:** run the **unit** tests that apply fixtures to temp copies. Do **not** add a job that mutates the CI checkout’s Core and hunts. `continue-on-error` is fine if you add a scheduled dry-run later — not required here.

5. Tests:

```powershell
Invoke-Pester -Strict -EnableExit -Path 'scripts/tests/AlBugSeededDefectDrill.Tests.ps1'
```

Cover: (a) fixture zone id is the picker winner on a ledger snippet where that zone is the only open/unseeded zone; (b) worktree cleaned up after a forced error; (c) production `AL_BUG_HUNT_RUN_LOG.jsonl` unchanged (assert mtime/hash); (d) `bugsmash` / `master` not pushed (mock `git push` must not be called).

## Acceptance criteria

- Harness exists; default path cannot push to `bugsmash`.
- Production hunt run log and ledger are not written by the drill.
- `/al-bug` is not required to implement or CI-test this prompt.
- One fixture + tests prove picker-hit and cleanup. Full “N hunts until find” automation is **out of scope** (that would be running `/al-bug`).

## Constraints

- Do not reopen G-ASSURANCE-02 as “this is the pen test.”
- Do not add English-phrase signals to the validity audit.
- Do not invent `PD-###` / `TB-###`.
- Working-tree safety on the **agent** branch: the fixture must not be applied to tracked Core there.
- Pester 5. Check nulls.
