namespace ArchLucid.Core.Budgeting;

/// <summary>Marks an in-flight LLM call as wallet-funded overage (TB-014).</summary>
public static class LlmTenantWalletOverageScope
{
    private static readonly AsyncLocal<decimal?> PendingEstimatedUsd = new();

    public static bool IsActive => PendingEstimatedUsd.Value is > 0m;

    public static decimal? PendingUsd => PendingEstimatedUsd.Value;

    public static IDisposable Begin(decimal estimatedUsd)
    {
        PendingEstimatedUsd.Value = estimatedUsd;

        return new ScopeDispose();
    }

    public static void Clear()
    {
        PendingEstimatedUsd.Value = null;
    }

    private sealed class ScopeDispose : IDisposable
    {
        public void Dispose()
        {
            PendingEstimatedUsd.Value = null;
        }
    }
}
