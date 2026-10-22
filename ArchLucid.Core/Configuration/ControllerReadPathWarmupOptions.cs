namespace ArchLucid.Core.Configuration;

/// <summary>
///     One-shot loopback GET warm-up after the host starts listening (JIT + MVC filter stack for cold read paths).
/// </summary>
public sealed class ControllerReadPathWarmupOptions
{
    public const string SectionPath = "ArchLucid:ControllerReadPathWarmup";

    /// <summary>When false, the hosted service exits without issuing warm-up requests.</summary>
    public bool Enabled
    {
        get;
        set;
    }

    /// <summary>Per-request HTTP timeout (seconds). Clamped 5–55 to stay under typical UI proxy budgets.</summary>
    public int RequestTimeoutSeconds
    {
        get;
        set;
    } = 30;

    public TimeSpan GetEffectiveRequestTimeout()
    {
        return TimeSpan.FromSeconds(Math.Clamp(RequestTimeoutSeconds, 5, 55));
    }
}
