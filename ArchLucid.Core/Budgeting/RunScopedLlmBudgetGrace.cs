namespace ArchLucid.Core.Budgeting;

/// <summary>Shared grace-ceiling helper for TB-939 run-scoped reservations.</summary>
public static class RunScopedLlmBudgetGrace
{
    public static decimal ApplyGrace(decimal hardCapUsd, decimal gracePercent)
    {
        if (hardCapUsd < 0m)
        {
            return 0m;
        }

        decimal grace = Math.Clamp(gracePercent, 0m, 100m);

        return hardCapUsd * (1m + (grace / 100m));
    }
}
