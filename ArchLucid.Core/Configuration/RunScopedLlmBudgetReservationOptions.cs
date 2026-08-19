namespace ArchLucid.Core.Configuration;

/// <summary>TB-939: admit-before-spend reservation for architecture run agent batches.</summary>
public sealed class RunScopedLlmBudgetReservationOptions
{
    public const string SectionName = "RunScopedLlmBudgetReservation";

    /// <summary>When false, orchestrator skips admit/reserve (pass-through).</summary>
    public bool Enabled { get; set; } = true;

    /// <summary>Assumed provider calls per agent task when estimating batch USD/tokens.</summary>
    public int AssumedCallsPerAgentTask { get; set; } = 1;

    /// <summary>Pending reservation TTL before automatic expiry in the store.</summary>
    public int ReservationTtlMinutes { get; set; } = 120;

    /// <summary>Grace percent applied to monthly hard cap when checking pending + pressure (like Quick Scan).</summary>
    public decimal AccountingGracePercent { get; set; } = 2m;
}
