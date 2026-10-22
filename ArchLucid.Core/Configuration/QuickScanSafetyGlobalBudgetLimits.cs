namespace ArchLucid.Core.Configuration;

/// <summary>Mandatory global anonymous Quick Scan spend ceilings (USD).</summary>
public sealed class QuickScanSafetyGlobalBudgetLimits
{
    public decimal MaxAnonymousSpendPerHour { get; set; } = 5m;

    public decimal MaxAnonymousSpendPerDay { get; set; } = 25m;

    public int BudgetReservationTtlMinutes { get; set; } = 15;

    public decimal BudgetAccountingGracePercent { get; set; } = 5m;
}
