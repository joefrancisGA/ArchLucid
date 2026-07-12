# Recurrence schedule cron migration (2026-07-11)

## Defect corrected

Before this fix, `SimpleScanScheduleCalculator` treated any unrecognized five-field cron (including the default `0 8 * * 1`) as **+1 day from the reference instant**. That caused weekly schedules to run daily and inflated AI spend.

After this fix:

- **Interval aliases** (`@hourly`, `@daily`, `@weekly`) still advance from the reference instant (documented preset semantics).
- **Five-field cron** uses **Cronos** calendar semantics in **UTC**.
- **Invalid / unsupported** expressions return `null`, are **rejected on create/update**, and never persist with a silent fallback.

## Persisted schedules likely affected

Run this inventory against production or staging SQL:

```sql
-- scripts/ops/recurrence-schedule-next-run-inventory.sql
```

**Misinterpreted pattern:** any `CronExpression` that is **not** one of:

| Expression | Previous behavior | Correct behavior |
|------------|-------------------|------------------|
| `@hourly` | +1 hour | unchanged |
| `@daily` | +1 day | unchanged |
| `@weekly` | +7 days | unchanged |
| `0 7 * * *` | 07:00 UTC daily | unchanged (now via Cronos) |
| **All other valid five-field cron** | **+1 day (wrong)** | **Cronos calendar UTC** |

Common affected values in the wild:

- `0 8 * * 1` (default post-commit form — **weekly Monday 08:00 UTC**)
- `0 9 * * 1`, `0 9 * * 2`, etc.

## Estimated impact

The inventory script reports:

1. `total_schedules` — all recurrence rows
2. `likely_misinterpreted` — cron not in the legacy allow-list above
3. `enabled_misinterpreted` — enabled rows that may have been firing too often

**Do not silently rewrite `NextRunUtc`.** Use the recorded migration procedure below.

## Safe recalculation procedure

1. Run `scripts/ops/recurrence-schedule-next-run-inventory.sql` and export results.
2. For each **enabled** row in `likely_misinterpreted`, compute the corrected `NextRunUtc` with the deployed API preview endpoint or application calculator.
3. Apply updates in a maintenance window with an audit row per schedule, for example:

```sql
-- Example operator script (adjust ScheduleId / NextRunUtc per row)
UPDATE dbo.ArchitectureReviewRecurrenceSchedules
SET NextRunUtc = @CorrectedNextRunUtc
WHERE ScheduleId = @ScheduleId;

-- Log via existing audit pipeline:
-- EventType = ArchitectureReviewRecurrenceScheduleUpdated
-- DataJson includes { scheduleId, previousNextRunUtc, correctedNextRunUtc, reason: "cron-semantics-fix-2026-07-11" }
```

4. Notify tenants if any enabled schedule had been firing daily instead of weekly.

## Frontend alignment

The “Next 5 scheduled runs (UTC)” preview now calls `POST /v1/governance/recurrence-schedules/preview-next-runs` so UI and worker share server semantics.
