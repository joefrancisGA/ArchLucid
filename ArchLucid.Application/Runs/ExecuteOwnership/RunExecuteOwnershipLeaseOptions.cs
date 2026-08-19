namespace ArchLucid.Application.Runs.ExecuteOwnership;

/// <summary>Configuration for execute ownership leasing and zombie reconciliation (TB-943 / TB-961).</summary>
public sealed class RunExecuteOwnershipLeaseOptions
{
    public const string SectionName = "ArchLucid:RunExecuteOwnershipLease";

    /// <summary>When false, leasing is skipped (InMemory hosts and explicit disable).</summary>
    public bool Enabled
    {
        get;
        set;
    } = true;

    /// <summary>Lease TTL renewed on acquire and optional heartbeat. Default 900s (authority outbox parity).</summary>
    public int LeaseDurationSeconds
    {
        get;
        set;
    } = 900;

    /// <summary>Background reconciliation cadence for expired leases.</summary>
    public int ReconciliationIntervalMinutes
    {
        get;
        set;
    } = 5;

    /// <summary>Max expired leases reconciled per pass.</summary>
    public int MaxReconciliationBatchSize
    {
        get;
        set;
    } = 25;
}
