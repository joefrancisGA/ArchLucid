namespace ArchLucid.Core.AiUsage;

public interface ITenantAiBudgetPolicyRepository
{
    Task<TenantAiBudgetPolicyRow?> GetByTenantIdAsync(Guid tenantId, CancellationToken cancellationToken = default);

    /// <summary>
    ///     Inserts the default self-service trial AI budget row when absent so new trials have a durable server-side
    ///     hard cap independent of admin dashboard visits.
    /// </summary>
    Task<bool> EnsureDefaultTrialPolicyIfAbsentAsync(
        Guid tenantId,
        decimal budgetAmountUsd,
        DateTimeOffset trialExpirationUtc,
        CancellationToken cancellationToken = default);
}

public sealed class TenantAiBudgetPolicyRow
{
    public Guid TenantId
    {
        get;
        init;
    }

    public decimal? BudgetAmountUsd
    {
        get;
        init;
    }

    public bool HardStopEnabled
    {
        get;
        init;
    } = true;

    public bool AllowCustomerAiProvider
    {
        get;
        init;
    }

    public DateTimeOffset? TrialExpirationUtc
    {
        get;
        init;
    }
}
