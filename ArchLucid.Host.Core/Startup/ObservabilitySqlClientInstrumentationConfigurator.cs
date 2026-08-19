using OpenTelemetry.Trace;

namespace ArchLucid.Host.Core.Startup;

/// <summary>Centralizes OpenTelemetry SQL client instrumentation options for all ArchLucid hosts.</summary>
internal static class ObservabilitySqlClientInstrumentationConfigurator
{
    internal static TracerProviderBuilder AddArchLucidSqlClientInstrumentation(this TracerProviderBuilder tracing)
    {
        tracing.AddSqlClientInstrumentation(options =>
        {
            // v1.15+ always captures sanitized statement text; RecordException surfaces SQL errors on spans.
            options.RecordException = true;
        });

        return tracing;
    }
}
