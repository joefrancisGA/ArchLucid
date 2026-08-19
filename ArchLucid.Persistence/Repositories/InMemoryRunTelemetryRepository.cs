using System.Data;

using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Persistence.Repositories;

/// <summary>
///     In-memory no-op for <see cref="IRunTelemetryRepository" /> when SQL storage is not configured.
/// </summary>
public sealed class InMemoryRunTelemetryRepository : IRunTelemetryRepository
{
    /// <inheritdoc />
    public Task InsertCommitMetricsIfAbsentAsync(RunCommitTelemetryWriteRequest request, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);

        return Task.CompletedTask;
    }
}
