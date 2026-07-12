namespace ArchLucid.Core.AiUsage;

/// <summary>Resolved effective AI budget policy for a tenant.</summary>
public sealed class TenantAiBudgetPolicySnapshot
{
    public AiUsageWorkspaceKind WorkspaceKind
    {
        get;
        init;
    }

    public decimal BudgetAmountUsd
    {
        get;
        init;
    }

    public decimal UsedAmountUsd
    {
        get;
        init;
    }

    public decimal RemainingAmountUsd
    {
        get;
        init;
    }

    public string ResetPeriod
    {
        get;
        init;
    } = "UTC month";

    public bool HardStopEnabled
    {
        get;
        init;
    }

    public DateTimeOffset? TrialExpirationUtc
    {
        get;
        init;
    }

    public bool WalletOverageAllowed
    {
        get;
        init;
    }

    public bool CustomerAiProviderConfigured
    {
        get;
        init;
    }

    public bool BlocksAdditionalLlmExecution
    {
        get;
        init;
    }
}
