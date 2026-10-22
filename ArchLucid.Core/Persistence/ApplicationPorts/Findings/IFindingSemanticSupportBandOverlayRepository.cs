using ArchLucid.Core.Scoping;

namespace ArchLucid.Core.Persistence.ApplicationPorts.Findings;

/// <summary>AS-060: mutable overlay for semantic support band until snapshot freeze.</summary>
public interface IFindingSemanticSupportBandOverlayRepository
{
    Task UpsertAsync(
        Guid findingsSnapshotId,
        ScopeContext scope,
        FindingSemanticSupportBandOverlayRecord overlay,
        CancellationToken cancellationToken = default);

    Task<IReadOnlyDictionary<string, FindingSemanticSupportBandOverlayRecord>> GetBySnapshotAsync(
        Guid findingsSnapshotId,
        ScopeContext scope,
        CancellationToken cancellationToken = default);

    Task FreezeSnapshotAsync(
        Guid findingsSnapshotId,
        ScopeContext scope,
        CancellationToken cancellationToken = default);
}
