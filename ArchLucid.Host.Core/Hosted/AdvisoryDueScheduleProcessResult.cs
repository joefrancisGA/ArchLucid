namespace ArchLucid.Host.Core.Hosted;

/// <summary>Per-invocation advisory scan totals for ACA exit-code aggregation (TB-088).</summary>
public sealed class AdvisoryDueScheduleProcessResult
{
    public int SuccessCount
    {
        get;
        init;
    }

    public int FailureCount
    {
        get;
        init;
    }

    public bool HasFailures => FailureCount > 0;
}
