> **Scope:** Internal engineering operations runbook for preserving bug-hunt diaries while resetting picker state; not customer-facing guidance.

> **Spine doc:** [START_HERE.md](../START_HERE.md).

# Bug hunt picker reset (option A)

When trunk has moved on and `/al-bug1`–`/al-bug4` show **exhaustedAll** or all zones parked, reset picker state while keeping hunt diaries.

## Command

```powershell
.\scripts\agent\al-bug-reset-picker-state.ps1
.\scripts\agent\al-bug-pick-zone.ps1 -Set 1 -Preview -Refresh
```

Archives run logs to `docs/library/archive/AL_BUG_HUNT_RUN_LOG_N_<date>.jsonl`, resets zone metadata counters in `AL_BUG_HUNT_LEDGER_N.md` only.

Does **not** rebase `bugsmash-N` branches.