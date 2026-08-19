using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

/// <summary>Counts stale architecture risk register rows for sponsor KPI surfaces.</summary>
public static class StaleArchitectureRiskCountCalculator
{
    public static int CountStale(ArchitectureRiskRegisterResponse? register)
    {
        if (register is null)
            return 0;

        return register.Entries.Count(static entry => entry.IsStale);
    }
}
