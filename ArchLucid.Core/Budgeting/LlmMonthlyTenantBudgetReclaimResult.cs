namespace ArchLucid.Core.Budgeting;

/// <summary>Batch orphan reclaim outcome for expired monthly per-call reservations (TB-976).</summary>
public sealed class LlmMonthlyTenantBudgetReclaimResult
{
    public int ReclaimedCount
    {
        get;
        init;
    }
}
