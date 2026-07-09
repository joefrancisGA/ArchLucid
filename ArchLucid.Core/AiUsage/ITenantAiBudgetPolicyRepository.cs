namespace ArchLucid.Core.AiUsage;

public interface ITenantAiBudgetPolicyRepository
{
    Task<TenantAiBudgetPolicyRow?> GetByTenantIdAsync(Guid tenantId, CancellationToken cancellationToken = default);
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
