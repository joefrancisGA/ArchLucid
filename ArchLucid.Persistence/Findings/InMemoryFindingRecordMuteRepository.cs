using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;

namespace ArchLucid.Persistence.Findings;

/// <summary>In-memory / storage-off: no relational finding rows; mute operations are unsupported.</summary>
public sealed class InMemoryFindingRecordMuteRepository : IFindingRecordMuteRepository
{
    public Task<IReadOnlyDictionary<string, FindingMuteFlag>> GetMuteFlagsAsync(
        Guid findingsSnapshotId,
        ScopeContext scope,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(scope);
        return Task.FromResult<IReadOnlyDictionary<string, FindingMuteFlag>>(
            new Dictionary<string, FindingMuteFlag>(StringComparer.Ordinal));
    }

    public Task<bool> TryMuteAsync(
        Guid runId,
        string findingId,
        string reason,
        ScopeContext scope,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        ArgumentNullException.ThrowIfNull(scope);
        return Task.FromResult(false);
    }
}
