namespace ArchLucid.Persistence.Integrations;

public sealed partial class InMemoryItsmFindingCorrelationRepository
{
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
}
