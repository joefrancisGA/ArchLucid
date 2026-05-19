using OpenTelemetry.Trace;

namespace ArchLucid.Host.Core.Startup.Tracing;

/// <summary>
///     Head sampler that always records spans whose names match configured <see cref="System.Diagnostics.ActivitySource" />
///     conventions; otherwise delegates to <see cref="_fallbackSampler" />.
/// </summary>
/// <remarks>
///     OpenTelemetry .NET does not expose ActivitySource on <see cref="SamplingParameters" />; ArchLucid maps
///     <c>ArchLucid.AuthorityRun</c> to <c>authority.*</c> span names. Use an OTLP collector for additional tail policies.
/// </remarks>
internal sealed class AlwaysSampleActivitySourceSampler : Sampler
{
    private readonly IReadOnlyList<string> _alwaysSampleActivitySources;
    private readonly Sampler _fallbackSampler;

    public AlwaysSampleActivitySourceSampler(IReadOnlyList<string> alwaysSampleActivitySources, Sampler fallbackSampler)
    {
        ArgumentNullException.ThrowIfNull(alwaysSampleActivitySources);
        ArgumentNullException.ThrowIfNull(fallbackSampler);

        _alwaysSampleActivitySources = alwaysSampleActivitySources;
        _fallbackSampler = fallbackSampler;
    }

    /// <inheritdoc />
    public override SamplingResult ShouldSample(in SamplingParameters samplingParameters)
    {
        if (_alwaysSampleActivitySources.Count > 0 &&
            AlwaysSampleActivitySourceSpanMatcher.MatchesAny(
                _alwaysSampleActivitySources,
                samplingParameters.Name))

            return new SamplingResult(SamplingDecision.RecordAndSample);

        return _fallbackSampler.ShouldSample(in samplingParameters);
    }
}
