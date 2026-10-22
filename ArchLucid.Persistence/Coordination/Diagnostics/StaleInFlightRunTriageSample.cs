namespace ArchLucid.Persistence.Coordination.Diagnostics;

/// <summary>One stale in-flight run for operator triage logs (TB-958).</summary>
public sealed class StaleInFlightRunTriageSample
{
    public Guid TenantId
    {
        get;
        init;
    }

    public Guid RunId
    {
        get;
        init;
    }

    public string Status
    {
        get;
        init;
    } = string.Empty;

    public double AgeSeconds
    {
        get;
        init;
    }
}
