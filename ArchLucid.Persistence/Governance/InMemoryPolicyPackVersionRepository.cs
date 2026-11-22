using System.Data;

using ArchLucid.Contracts.Governance.PolicyPacks;

namespace ArchLucid.Persistence.Governance;

/// <summary>
///     In-memory implementation of <see cref="IPolicyPackVersionRepository" /> for testing and storage-off mode.
///     Size-bounded at <see cref="MaxEntries" />; oldest entries are trimmed from the front when the cap is exceeded.
///     All operations are thread-safe via an exclusive lock.
/// </summary>
public sealed class InMemoryPolicyPackVersionRepository : IPolicyPackVersionRepository
{
    private const int MaxEntries = 500;
    private readonly Lock _gate = new();
    private readonly List<PolicyPackVersion> _items = [];

    public Task CreateAsync(
        PolicyPackVersion version,
        CancellationToken ct,
        IDbConnection? connection = null,
        IDbTransaction? transaction = null)
    {
        ArgumentNullException.ThrowIfNull(version);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            _items.Add(Copy(version));

            if (_items.Count > MaxEntries)
                _items.RemoveRange(0, _items.Count - MaxEntries);
        }

        return Task.CompletedTask;
    }

    public Task UpdateAsync(PolicyPackVersion version, CancellationToken ct)
    {
        ArgumentNullException.ThrowIfNull(version);
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {

            int idx = _items.FindIndex(x => x.PolicyPackVersionId == version.PolicyPackVersionId);

            if (idx >= 0)
            {
                PolicyPackVersion stored = _items[idx];
                stored.ContentJson = version.ContentJson;
                stored.IsPublished = version.IsPublished;
            }
        }

        return Task.CompletedTask;
    }

    public Task<PolicyPackVersion?> GetByPackAndVersionAsync(
        Guid policyPackId,
        string version,
        CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        string versionKey = PolicyPackSemVerVersion.NormalizeLookupKey(version);
        lock (_gate)
        {
            PolicyPackVersion? row = _items.FirstOrDefault(x => x.PolicyPackId == policyPackId &&
                                                                string.Equals(x.Version, versionKey,
                                                                    StringComparison.OrdinalIgnoreCase));
            return Task.FromResult(row is null ? null : Copy(row));
        }
    }

    public Task<(PolicyPackVersion Version, string? PreviousContentJson)> UpsertPublishedVersionAsync(
        Guid policyPackId,
        string version,
        string contentJson,
        CancellationToken ct)
    {
        string versionKey = PolicyPackSemVerVersion.NormalizeLookupKey(version);
        ct.ThrowIfCancellationRequested();

        lock (_gate)
        {
            int idx = _items.FindIndex(x => x.PolicyPackId == policyPackId &&
                                            string.Equals(x.Version, versionKey, StringComparison.OrdinalIgnoreCase));

            if (idx >= 0)
            {
                PolicyPackVersion existing = _items[idx];
                string previous = existing.ContentJson;
                existing.ContentJson = contentJson;
                existing.IsPublished = true;
                _items[idx] = existing;

                return Task.FromResult<(PolicyPackVersion, string?)>((Copy(existing), previous));
            }

            PolicyPackVersion inserted = new()
            {
                PolicyPackVersionId = Guid.NewGuid(),
                PolicyPackId = policyPackId,
                Version = versionKey,
                ContentJson = contentJson,
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                IsPublished = true
            };

            _items.Add(inserted);

            if (_items.Count > MaxEntries)
                _items.RemoveRange(0, _items.Count - MaxEntries);

            return Task.FromResult<(PolicyPackVersion, string?)>((Copy(inserted), null));
        }
    }

    public Task<IReadOnlyList<PolicyPackVersion>> ListByPackAsync(Guid policyPackId, CancellationToken ct)
    {
        ct.ThrowIfCancellationRequested();
        lock (_gate)
        {
            // List omits body (empty ContentJson); GetByPackAndVersionAsync returns the full row.
            List<PolicyPackVersion> result = _items
                .Where(x => x.PolicyPackId == policyPackId)
                .OrderByDescending(x => x.CreatedUtc)
                .Select(static version => Copy(version, includeContent: false))
                .ToList();
            return Task.FromResult<IReadOnlyList<PolicyPackVersion>>(result);
        }
    }

    private static PolicyPackVersion Copy(PolicyPackVersion version, bool includeContent = true) =>
        new()
        {
            PolicyPackVersionId = version.PolicyPackVersionId,
            PolicyPackId = version.PolicyPackId,
            Version = version.Version,
            ContentJson = includeContent ? version.ContentJson : string.Empty,
            CreatedUtc = version.CreatedUtc,
            IsPublished = version.IsPublished,
        };
}
