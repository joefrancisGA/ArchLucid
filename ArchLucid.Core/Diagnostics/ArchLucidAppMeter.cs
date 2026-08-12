using System.Diagnostics.Metrics;

namespace ArchLucid.Core.Diagnostics;

/// <summary>
///     Shared OpenTelemetry <see cref="Meter" /> singleton. Lives outside <see cref="ArchLucidInstrumentation" /> so
///     subsystem partials can declare instruments without static-initialization order hazards.
/// </summary>
internal static class ArchLucidAppMeter
{
    internal static readonly Meter Instance = new(ArchLucidMeterNames.Meter, "1.0.0");
}
