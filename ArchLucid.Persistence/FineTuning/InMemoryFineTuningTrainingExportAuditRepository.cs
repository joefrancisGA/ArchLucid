using System.Collections.Concurrent;

using ArchLucid.Core.Persistence.ApplicationPorts.FineTuning;

namespace ArchLucid.Persistence.FineTuning;

/// <summary>In-memory export audit store for Development and tests.</summary>
public sealed class InMemoryFineTuningTrainingExportAuditRepository : IFineTuningTrainingExportAuditRepository
{
    private readonly ConcurrentBag<FineTuningTrainingExportAuditRecord> _records = [];

    public IReadOnlyList<FineTuningTrainingExportAuditRecord> Records => _records.ToList();

    /// <inheritdoc />
    public Task InsertAsync(FineTuningTrainingExportAuditRecord record, CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(record);
        _records.Add(record);

        return Task.CompletedTask;
    }
}
