namespace ArchLucid.Persistence.Integrations;

public sealed partial class InMemoryItsmFindingCorrelationRepository
{
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
}
