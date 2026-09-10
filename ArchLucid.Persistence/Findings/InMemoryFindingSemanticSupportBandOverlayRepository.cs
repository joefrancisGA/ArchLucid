using ArchLucid.Core.Persistence;
using ArchLucid.Core.Persistence.ApplicationPorts.Findings;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Persistence.Findings;

public sealed class InMemoryFindingSemanticSupportBandOverlayRepository : IFindingSemanticSupportBandOverlayRepository
{
    private readonly object _gate = new();
    private readonly Dictionary<OverlayKey, FindingSemanticSupportBandOverlayRecord> _overlays = new();

    public Task UpsertAsync(
        Guid findingsSnapshotId,
        ScopeContext scope,
        FindingSemanticSupportBandOverlayRecord overlay,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);
        ArgumentNullException.ThrowIfNull(overlay);
        ArgumentException.ThrowIfNullOrWhiteSpace(overlay.FindingId);

        OverlayKey key = new(findingsSnapshotId, overlay.FindingId.Trim(), scope);

        lock (_gate)
        {
            if (_overlays.TryGetValue(key, out FindingSemanticSupportBandOverlayRecord? existing)
                && existing.FrozenAtUtc is not null)
            {
                throw new InvalidOperationException(
                    $"Semantic support band overlay for finding '{overlay.FindingId}' is frozen.");
            }

            DateTime utcNow = TimeProvider.System.GetUtcNow().UtcDateTime;

            _overlays[key] = new FindingSemanticSupportBandOverlayRecord
            {
                FindingId = overlay.FindingId.Trim(),
                Band = overlay.Band,
                ScorerVersion = overlay.ScorerVersion,
                EvidenceExcerptHashSha256 = overlay.EvidenceExcerptHashSha256,
                ScoredAtUtc = overlay.ScoredAtUtc == default ? utcNow : overlay.ScoredAtUtc,
                UpdatedUtc = utcNow,
                FrozenAtUtc = existing?.FrozenAtUtc,
            };
        }

        return Task.CompletedTask;
    }

    public Task<IReadOnlyDictionary<string, FindingSemanticSupportBandOverlayRecord>> GetBySnapshotAsync(
        Guid findingsSnapshotId,
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        lock (_gate)
        {
            Dictionary<string, FindingSemanticSupportBandOverlayRecord> map = new(StringComparer.Ordinal);

            foreach (KeyValuePair<OverlayKey, FindingSemanticSupportBandOverlayRecord> entry in _overlays)
            {
                if (entry.Key.FindingsSnapshotId != findingsSnapshotId)
                    continue;

                if (!entry.Key.MatchesScope(scope))
                    continue;

                map[entry.Value.FindingId] = entry.Value;
            }

            return Task.FromResult<IReadOnlyDictionary<string, FindingSemanticSupportBandOverlayRecord>>(map);
        }
    }

    public Task FreezeSnapshotAsync(
        Guid findingsSnapshotId,
        ScopeContext scope,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(scope);

        DateTime utcNow = TimeProvider.System.GetUtcNow().UtcDateTime;

        lock (_gate)
        {
            foreach (KeyValuePair<OverlayKey, FindingSemanticSupportBandOverlayRecord> entry in _overlays.ToList())
            {
                if (entry.Key.FindingsSnapshotId != findingsSnapshotId)
                    continue;

                if (!entry.Key.MatchesScope(scope))
                    continue;

                FindingSemanticSupportBandOverlayRecord existing = entry.Value;

                _overlays[entry.Key] = new FindingSemanticSupportBandOverlayRecord
                {
                    FindingId = existing.FindingId,
                    Band = existing.Band,
                    ScorerVersion = existing.ScorerVersion,
                    EvidenceExcerptHashSha256 = existing.EvidenceExcerptHashSha256,
                    ScoredAtUtc = existing.ScoredAtUtc,
                    UpdatedUtc = utcNow,
                    FrozenAtUtc = existing.FrozenAtUtc ?? utcNow,
                };
            }
        }

        return Task.CompletedTask;
    }

    private readonly record struct OverlayKey(Guid FindingsSnapshotId, string FindingId, ScopeContext Scope)
    {
        public bool MatchesScope(ScopeContext scope) =>
            Scope.TenantId == scope.TenantId
            && Scope.WorkspaceId == scope.WorkspaceId
            && Scope.ProjectId == scope.ProjectId;
    }
}
