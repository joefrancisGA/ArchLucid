namespace ArchLucid.Host.Core.Configuration;

/// <summary>
/// Trace sampling settings under <c>Observability:Tracing</c>.
/// </summary>
public sealed class ObservabilityTracingOptions
{
    /// <summary>
    /// Head-based sampling probability for root spans (0.0–1.0). Default <c>1.0</c> preserves historical AlwaysOn behavior.
    /// </summary>
    public double SamplingRatio
    {
        get;
        set;
    } = 1.0;

    /// <summary>
    /// Activity source names that should always be sampled at full fidelity when <see cref="SamplingRatio"/> is below
    /// <c>1.0</c>. ArchLucid maps <c>ArchLucid.AuthorityRun</c> to <c>authority.*</c> span names at head sampling time.
    /// </summary>
    public string[]? AlwaysSampleActivitySources
    {
        get;
        set;
    }
}
