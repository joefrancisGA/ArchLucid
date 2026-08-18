using System.Collections.Concurrent;

namespace ArchLucid.Persistence.Integrations;

/// <summary>In-memory ITSM correlation store for <c>StorageProvider=InMemory</c> (no <c>FindingRecords</c> updates).</summary>
public sealed class InMemoryItsmFindingCorrelationRepository : IItsmFindingCorrelationRepository
{
    private readonly ConcurrentDictionary<string, ItsmFindingCorrelationRecord> _byKey = new();

    /// <inheritdoc />
    public Task<ItsmFindingCorrelationRecord?> TryGetByExternalKeyAsync(
        string provider,
        string externalKey,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(provider))
            throw new ArgumentException("provider is required.", nameof(provider));

        if (string.IsNullOrWhiteSpace(externalKey))
            throw new ArgumentException("externalKey is required.", nameof(externalKey));

        List<ItsmFindingCorrelationRecord> matches = MatchByProviderAndExternalKey(provider, externalKey);

        if (matches.Count != 1)
            return Task.FromResult<ItsmFindingCorrelationRecord?>(null);

        return Task.FromResult<ItsmFindingCorrelationRecord?>(matches[0]);
    }

    /// <inheritdoc />
    public Task<ItsmFindingCorrelationRecord?> TryGetByExternalKeyForTenantAsync(
        Guid tenantId,
        string provider,
        string externalKey,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (string.IsNullOrWhiteSpace(provider))
            throw new ArgumentException("provider is required.", nameof(provider));

        if (string.IsNullOrWhiteSpace(externalKey))
            throw new ArgumentException("externalKey is required.", nameof(externalKey));

        ItsmFindingCorrelationRecord? match = MatchByProviderAndExternalKey(provider, externalKey)
            .SingleOrDefault(r => r.TenantId == tenantId);

        return Task.FromResult(match);
    }

    /// <inheritdoc />
    public Task<ItsmFindingCorrelationRecord?> TryGetByFindingAndProviderAsync(
        Guid tenantId,
        string findingId,
        string provider,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("findingId is required.", nameof(findingId));

        if (string.IsNullOrWhiteSpace(provider))
            throw new ArgumentException("provider is required.", nameof(provider));

        string trimmedFinding = findingId.Trim();
        string trimmedProvider = provider.Trim();

        ItsmFindingCorrelationRecord? match = _byKey.Values
            .Where(r =>
                r.TenantId == tenantId &&
                string.Equals(r.FindingId, trimmedFinding, StringComparison.Ordinal) &&
                string.Equals(r.Provider, trimmedProvider, StringComparison.Ordinal))
            .OrderByDescending(r => r.CreatedUtc)
            .FirstOrDefault();

        return Task.FromResult(match);
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<ItsmFindingCorrelationRecord>> ListByFindingAsync(
        Guid tenantId,
        string findingId,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("findingId is required.", nameof(findingId));

        string trimmedFinding = findingId.Trim();

        List<ItsmFindingCorrelationRecord> rows = _byKey.Values
            .Where(r =>
                r.TenantId == tenantId &&
                string.Equals(r.FindingId, trimmedFinding, StringComparison.Ordinal))
            .OrderBy(r => r.CreatedUtc)
            .ToList();

        return Task.FromResult<IReadOnlyList<ItsmFindingCorrelationRecord>>(rows);
    }

    /// <inheritdoc />
    public Task<IReadOnlyList<ItsmFindingCorrelationRecord>> ListByFindingsAsync(
        Guid tenantId,
        IReadOnlyList<string> findingIds,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (findingIds is null)
            throw new ArgumentNullException(nameof(findingIds));

        HashSet<string> normalizedFindingIds = findingIds
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .Select(static id => id.Trim())
            .ToHashSet(StringComparer.Ordinal);

        if (normalizedFindingIds.Count == 0)
            return Task.FromResult<IReadOnlyList<ItsmFindingCorrelationRecord>>(Array.Empty<ItsmFindingCorrelationRecord>());

        List<ItsmFindingCorrelationRecord> rows = _byKey.Values
            .Where(r => r.TenantId == tenantId && normalizedFindingIds.Contains(r.FindingId))
            .OrderBy(r => r.FindingId, StringComparer.Ordinal)
            .ThenBy(r => r.CreatedUtc)
            .ToList();

        return Task.FromResult<IReadOnlyList<ItsmFindingCorrelationRecord>>(rows);
    }

    /// <inheritdoc />
    public Task RegisterAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string findingId,
        string provider,
        string externalKey,
        string? externalSysId,
        Guid? findingRecordId,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("findingId is required.", nameof(findingId));

        if (string.IsNullOrWhiteSpace(provider))
            throw new ArgumentException("provider is required.", nameof(provider));

        if (string.IsNullOrWhiteSpace(externalKey))
            throw new ArgumentException("externalKey is required.", nameof(externalKey));

        string k = Key(tenantId, provider, externalKey);

        if (_byKey.TryGetValue(k, out ItsmFindingCorrelationRecord? existing) &&
            existing.FindingRecordId is null &&
            findingRecordId is not null)
        {
            ItsmFindingCorrelationRecord updated = new()
            {
                TenantId = existing.TenantId,
                WorkspaceId = existing.WorkspaceId,
                ProjectId = existing.ProjectId,
                FindingId = existing.FindingId,
                Provider = existing.Provider,
                ExternalKey = existing.ExternalKey,
                ExternalSysId = existing.ExternalSysId,
                CreatedUtc = existing.CreatedUtc,
                FindingRecordId = findingRecordId
            };

            _byKey[k] = updated;

            return Task.CompletedTask;
        }

        _ = _byKey.TryAdd(
            k,
            new ItsmFindingCorrelationRecord
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                FindingId = findingId.Trim(),
                Provider = provider.Trim(),
                ExternalKey = externalKey.Trim(),
                ExternalSysId = string.IsNullOrWhiteSpace(externalSysId) ? null : externalSysId.Trim(),
                CreatedUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
                FindingRecordId = findingRecordId
            });

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<Guid?> TryResolveFindingRecordIdForRunFindingAsync(
        Guid tenantId,
        Guid runId,
        string findingId,
        CancellationToken ct) =>
        Task.FromResult<Guid?>(null);

    /// <inheritdoc />
    public Task<Guid?> TryResolveLatestCommittedFindingRecordIdAsync(
        Guid tenantId,
        string findingId,
        CancellationToken ct) =>
        Task.FromResult<Guid?>(null);

    /// <inheritdoc />
    public Task<ItsmFindingCorrelationUpdateResult> UpdateExternalTrackingAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string findingId,
        string provider,
        string externalKey,
        string? externalSysId,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("findingId is required.", nameof(findingId));

        if (string.IsNullOrWhiteSpace(provider))
            throw new ArgumentException("provider is required.", nameof(provider));

        if (string.IsNullOrWhiteSpace(externalKey))
            throw new ArgumentException("externalKey is required.", nameof(externalKey));

        string trimmedFinding = findingId.Trim();
        string trimmedProvider = provider.Trim();
        string trimmedExternalKey = externalKey.Trim();
        string? trimmedExternalSysId = string.IsNullOrWhiteSpace(externalSysId) ? null : externalSysId.Trim();

        ItsmFindingCorrelationRecord? prior = _byKey.Values
            .Where(r =>
                r.TenantId == tenantId &&
                string.Equals(r.FindingId, trimmedFinding, StringComparison.Ordinal) &&
                string.Equals(r.Provider, trimmedProvider, StringComparison.Ordinal))
            .OrderByDescending(r => r.CreatedUtc)
            .FirstOrDefault();

        if (prior is null)
            return Task.FromResult(ItsmFindingCorrelationUpdateResult.NotFound);

        bool externalKeyChanged = !string.Equals(prior.ExternalKey, trimmedExternalKey, StringComparison.Ordinal);
        bool externalSysIdChanged = !string.Equals(prior.ExternalSysId, trimmedExternalSysId, StringComparison.Ordinal);

        if (!externalKeyChanged && !externalSysIdChanged)
        {
            return Task.FromResult(new ItsmFindingCorrelationUpdateResult
            {
                Status = ItsmFindingCorrelationUpdateStatus.Unchanged,
                Prior = prior,
                Current = prior
            });
        }

        if (externalKeyChanged)
        {
            bool conflict = _byKey.Values.Any(r =>
                r.TenantId == tenantId &&
                string.Equals(r.Provider, trimmedProvider, StringComparison.Ordinal) &&
                string.Equals(r.ExternalKey, trimmedExternalKey, StringComparison.Ordinal) &&
                !string.Equals(r.FindingId, trimmedFinding, StringComparison.Ordinal));

            if (conflict)
                return Task.FromResult(ItsmFindingCorrelationUpdateResult.ExternalKeyConflict);
        }

        string priorKey = Key(tenantId, prior.Provider, prior.ExternalKey);
        _ = _byKey.TryRemove(priorKey, out _);

        ItsmFindingCorrelationRecord current = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            FindingId = trimmedFinding,
            Provider = trimmedProvider,
            ExternalKey = trimmedExternalKey,
            ExternalSysId = trimmedExternalSysId,
            FindingRecordId = prior.FindingRecordId,
            CreatedUtc = prior.CreatedUtc
        };

        string nextKey = Key(tenantId, trimmedProvider, trimmedExternalKey);
        _ = _byKey.TryAdd(nextKey, current);

        return Task.FromResult(new ItsmFindingCorrelationUpdateResult
        {
            Status = ItsmFindingCorrelationUpdateStatus.Updated,
            Prior = prior,
            Current = current
        });
    }

    /// <inheritdoc />
    public Task<ItsmFindingCorrelationRecord?> RemoveByFindingAndProviderAsync(
        Guid tenantId,
        string findingId,
        string provider,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("findingId is required.", nameof(findingId));

        if (string.IsNullOrWhiteSpace(provider))
            throw new ArgumentException("provider is required.", nameof(provider));

        string trimmedFinding = findingId.Trim();
        string trimmedProvider = provider.Trim();

        ItsmFindingCorrelationRecord? prior = _byKey.Values
            .Where(r =>
                r.TenantId == tenantId &&
                string.Equals(r.FindingId, trimmedFinding, StringComparison.Ordinal) &&
                string.Equals(r.Provider, trimmedProvider, StringComparison.Ordinal))
            .OrderByDescending(r => r.CreatedUtc)
            .FirstOrDefault();

        if (prior is null)
            return Task.FromResult<ItsmFindingCorrelationRecord?>(null);

        string priorKey = Key(tenantId, prior.Provider, prior.ExternalKey);
        _ = _byKey.TryRemove(priorKey, out _);

        return Task.FromResult<ItsmFindingCorrelationRecord?>(prior);
    }

    /// <inheritdoc />
    public Task<int> UpdateHumanReviewStatusForFindingAsync(
        Guid tenantId,
        string findingId,
        string humanReviewStatus,
        Guid? findingRecordId,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("findingId is required.", nameof(findingId));

        return string.IsNullOrWhiteSpace(humanReviewStatus)
            ? throw new ArgumentException("humanReviewStatus is required.", nameof(humanReviewStatus))
            :
            // In-memory hosts do not model FindingRecords; webhook path still emits audit when correlation exists.
            Task.FromResult(0);
    }

    /// <inheritdoc />
    public Task<bool> FindingRecordExistsAsync(
        Guid tenantId,
        string findingId,
        Guid? findingRecordId,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("findingId is required.", nameof(findingId));

        string trimmed = findingId.Trim();

        bool any = _byKey.Values.Any(r =>
            r.TenantId == tenantId &&
            string.Equals(r.FindingId, trimmed, StringComparison.Ordinal));

        return Task.FromResult(any);
    }

    private static string Key(Guid tenantId, string provider, string externalKey) =>
        $"{tenantId:D}\u001f{provider.Trim()}\u001f{externalKey.Trim()}";

    private List<ItsmFindingCorrelationRecord> MatchByProviderAndExternalKey(string provider, string externalKey)
    {
        string trimmedProvider = provider.Trim();
        string trimmedExternalKey = externalKey.Trim();

        return _byKey.Values
            .Where(r =>
                string.Equals(r.Provider, trimmedProvider, StringComparison.Ordinal) &&
                string.Equals(r.ExternalKey, trimmedExternalKey, StringComparison.Ordinal))
            .ToList();
    }
}
