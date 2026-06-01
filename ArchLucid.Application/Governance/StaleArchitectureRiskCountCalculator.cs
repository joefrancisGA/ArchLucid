using ArchLucid.Contracts.Governance;

namespace ArchLucid.Application.Governance;

/// <summary>Counts stale architecture risk register rows for executive KPI surfaces.</summary>
public static class StaleArchitectureRiskCountCalculator
{
    public static int CountStale(ArchitectureRiskRegisterResponse register)
    {
        ArgumentNullException.ThrowIfNull(register);

        return register.Entries.Count(static entry => entry.IsStale);
    }
}
