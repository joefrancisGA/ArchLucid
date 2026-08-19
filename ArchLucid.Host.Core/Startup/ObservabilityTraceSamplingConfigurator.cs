using System.Globalization;

using ArchLucid.Core.Diagnostics;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Startup.Tracing;

using OpenTelemetry.Trace;

namespace ArchLucid.Host.Core.Startup;

/// <summary>
/// Applies head-based trace sampling from <c>Observability:Tracing</c> before any trace instrumentations are registered.
/// </summary>
public static class ObservabilityTraceSamplingConfigurator
{
    /// <summary>
    /// Configures the trace <see cref="Sampler"/> on <paramref name="tracing"/> from configuration.
    /// </summary>
    /// <remarks>
    /// <para>
    /// <c>Observability:Tracing:AlwaysSampleActivitySources</c> lists ActivitySource names (for example
    /// <c>ArchLucid.AuthorityRun</c>) that are always recorded when fractional <c>SamplingRatio</c> is in effect.
    /// The .NET SDK does not pass ActivitySource on <see cref="Sampler.ShouldSample(OpenTelemetry.Trace.SamplingParameters@)"/>,
    /// so ArchLucid matches known sources via span naming (<c>authority.*</c> for authority runs). Supplement with OTLP
    /// collector tail sampling for other retention rules.
    /// </para>
    /// </remarks>
    public static void ConfigureTraceSampling(TracerProviderBuilder tracing, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(tracing);
        ArgumentNullException.ThrowIfNull(configuration);

        IReadOnlyList<string> alwaysSampleActivitySources = ResolveAlwaysSampleActivitySources(configuration);

        // Avoid ConfigurationBinder.GetValue<double> when the key exists but is not parseable — it throws and would
        // fail host startup on a typo in production config.
        string? samplingRatioRaw = configuration[$"{ObservabilityHostOptions.SectionName}:Tracing:SamplingRatio"]?.Trim();
        double samplingRatio = 1.0;

        if (!string.IsNullOrEmpty(samplingRatioRaw))

            if (!double.TryParse(
                    samplingRatioRaw,
                    NumberStyles.Float,
                    CultureInfo.InvariantCulture,
                    out double parsed) ||
                double.IsNaN(parsed) ||
                double.IsInfinity(parsed))

                samplingRatio = 1.0;

            else

                samplingRatio = Math.Clamp(parsed, 0.0, 1.0);

        if (samplingRatio >= 1.0 || alwaysSampleActivitySources.Count == 0)
            return;

        Sampler ratioSampler = new TraceIdRatioBasedSampler(samplingRatio);
        Sampler alwaysSampleRoot = new AlwaysSampleActivitySourceSampler(alwaysSampleActivitySources, ratioSampler);
        Sampler alwaysSampleUnderUnsampledParent =
            new AlwaysSampleActivitySourceSampler(alwaysSampleActivitySources, new AlwaysOffSampler());

        tracing.SetSampler(
            new ParentBasedSampler(
                alwaysSampleRoot,
                localParentNotSampled: alwaysSampleUnderUnsampledParent,
                remoteParentNotSampled: alwaysSampleUnderUnsampledParent));
    }

    private static IReadOnlyList<string> ResolveAlwaysSampleActivitySources(IConfiguration configuration)
    {
        string[]? configured = configuration
            .GetSection($"{ObservabilityHostOptions.SectionName}:Tracing:AlwaysSampleActivitySources")
            .Get<string[]>();

        HashSet<string> names = new(StringComparer.Ordinal);

        if (configured is { Length: > 0 })
        {
            foreach (string entry in configured)
            {
                if (!string.IsNullOrWhiteSpace(entry))
                    names.Add(entry.Trim());
            }
        }

        if (names.Count == 0)
            names.Add(ArchLucidInstrumentation.AuthorityRun.Name);

        return names.ToArray();
    }
}
