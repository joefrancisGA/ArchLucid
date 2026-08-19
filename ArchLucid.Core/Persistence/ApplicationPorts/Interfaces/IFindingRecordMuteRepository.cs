using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Interfaces;

/// <summary>Relational mute read/write for <c>dbo.FindingRecords</c> (defense-in-depth with tenant scope).</summary>
public interface IFindingRecordMuteRepository
{
    /// <summary>Loads mute columns for every row in the snapshot (typically small N per review).</summary>
    Task<IReadOnlyDictionary<string, FindingMuteFlag>> GetMuteFlagsAsync(
        Guid findingsSnapshotId,
        ScopeContext scope,
        CancellationToken ct);

    /// <summary>Persists mute for the finding on the given run; returns false when no row was updated.</summary>
    Task<bool> TryMuteAsync(
        Guid runId,
        string findingId,
        string reason,
        ScopeContext scope,
        CancellationToken ct,
        DateTimeOffset? expiresAtUtc = null);
}
