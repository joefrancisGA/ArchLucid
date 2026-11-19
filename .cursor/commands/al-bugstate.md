# Bug hunt yield desk — `/al-bugstate`

Report **rolling 24-hour** hunt outcomes for each **bugsmash repo** (zone sets **1–4**): how many **non-seed** runs found defects (**hit**) vs were **dry**. Read-only; no hunts, ledger edits, or commits.

Default model: **Composer 2.5 slow** (`composer-2.5`).

---

## Arguments

```text
/al-bugstate
/al-bugstate fetch
/al-bugstate local
/al-bugstate 2
/al-bugstate fetch 2
```

| Token | Meaning |
|--------|---------|
| **`fetch`** | Run `git fetch origin` for the relevant `bugsmash-N` branch(es) before reading logs. |
| **`local`** | Use **working-tree** `docs/library/AL_BUG_HUNT_RUN_LOG_N.jsonl` files instead of **`origin/bugsmash-N`**. |
| **`1`–`4`** | Limit to one zone set (optional). |

With **no arguments**, use **remote branch tips** (`origin/bugsmash-1` … `origin/bugsmash-4`) and **do not** fetch.

---

## Procedure

1. From repo root, run:

   ```powershell
   .\scripts\agent\al-bug-state.ps1 [-Fetch] [-Local] [-Set N]
   ```

   Match flags to parsed arguments (`fetch` → `-Fetch`, `local` → `-Local`, set digit → `-Set`).

2. Paste the script’s **markdown table** into chat. Optionally summarize totals in one sentence.

3. **Do not** start `/al-bug`, `/1`–`/4`, or modify ledgers.

---

## Interpretation

| Outcome | Counted as |
|---------|------------|
| **`hit`** | Defect found (non-seed) |
| **`dry`** | Hunt completed, no defect (non-seed) |
| **`seed-only`** | Excluded from non-seed totals (shown only in JSON `seedOnly24h` per set) |
| **`held-for-triage`** | Excluded from non-seed totals |

Window: **UTC**, last **24 hours** ending at script run time (or `-AtUtc` in tests).

**Remote default:** counts reflect **pushed** hunts on each `bugsmash-N` branch. Unpushed local runs are invisible until push (use **`local`** to include the current checkout’s log files).

---

## Related

| Command | Role |
|---------|------|
| **`/1`–`/4`** | Hunt one zone in a set |
| **`al-bug-rolling-stats.ps1 -Set N -Rolling24h`** | Per-set rolling stats with product-line split (single set) |