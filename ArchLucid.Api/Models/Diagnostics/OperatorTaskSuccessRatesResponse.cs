namespace ArchLucid.Api.Models.Diagnostics;

/// <summary>Read model for operator onboarding counters (process lifetime; resets on API host restart).</summary>
public sealed class OperatorTaskSuccessRatesResponse
{
    /// <summary>Human-readable note about the measurement window.</summary>
    public string WindowNote
    {
        get;
        set;
    } = string.Empty;

    public long FirstRunCommittedTotal
    {
        get;
        set;
    }

    public long FirstSessionCompletedTotal
    {
        get;
        set;
    }

    /// <summary>Ratio first_run_committed / max(first_session_completed,1) when both are process-cumulative.</summary>
    public double FirstRunCommittedPerSessionRatio
    {
        get;
        set;
    }
}
