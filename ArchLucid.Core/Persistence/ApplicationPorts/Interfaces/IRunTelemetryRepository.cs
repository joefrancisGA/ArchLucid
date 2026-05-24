using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Interfaces;

/// <summary>Writes commit-time scalar metrics to <c>dbo.RunTelemetry</c>.</summary>
public interface IRunTelemetryRepository
{
    /// <summary>
    ///     Inserts a telemetry row when none exists for <paramref name="request.RunId" />; otherwise no-ops.
    /// </summary>
    Task InsertCommitMetricsIfAbsentAsync(RunCommitTelemetryWriteRequest request, CancellationToken cancellationToken);
}
