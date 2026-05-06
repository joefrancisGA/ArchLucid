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

        string k = Key(provider, externalKey);

        return Task.FromResult(_byKey.TryGetValue(k, out ItsmFindingCorrelationRecord? row) ? row : null);
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
        CancellationToken ct)
    {
        _ = externalSysId;

        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("findingId is required.", nameof(findingId));

        if (string.IsNullOrWhiteSpace(provider))
            throw new ArgumentException("provider is required.", nameof(provider));

        if (string.IsNullOrWhiteSpace(externalKey))
            throw new ArgumentException("externalKey is required.", nameof(externalKey));

        string k = Key(provider, externalKey);

        _ = _byKey.TryAdd(
            k,
            new ItsmFindingCorrelationRecord
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                FindingId = findingId.Trim()
            });

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<int> UpdateHumanReviewStatusForFindingAsync(
        Guid tenantId,
        string findingId,
        string humanReviewStatus,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (string.IsNullOrWhiteSpace(findingId))
            throw new ArgumentException("findingId is required.", nameof(findingId));

        if (string.IsNullOrWhiteSpace(humanReviewStatus))
            throw new ArgumentException("humanReviewStatus is required.", nameof(humanReviewStatus));

        // In-memory hosts do not model FindingRecords; webhook path still emits audit when correlation exists.
        return Task.FromResult(0);
    }

    private static string Key(string provider, string externalKey) =>
        $"{provider.Trim()}\u001f{externalKey.Trim()}";
}
