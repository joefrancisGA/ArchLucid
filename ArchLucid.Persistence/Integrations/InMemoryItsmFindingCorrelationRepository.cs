using System.Collections.Concurrent;
using System.Linq;

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

        return Task.FromResult(_byKey.GetValueOrDefault(k));
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
            new ItsmFindingCorrelationRecord { TenantId = tenantId, WorkspaceId = workspaceId, ProjectId = projectId, FindingId = findingId.Trim() });

        return Task.CompletedTask;
    }

    /// <inheritdoc />
    public Task<int> UpdateHumanReviewStatusForFindingAsync(
        Guid tenantId,
        string findingId,
        string humanReviewStatus,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (string.IsNullOrWhiteSpace(findingId)) throw new ArgumentException("findingId is required.", nameof(findingId));

        return string.IsNullOrWhiteSpace(humanReviewStatus)
            ? throw new ArgumentException("humanReviewStatus is required.", nameof(humanReviewStatus))
            :
            // In-memory hosts do not model FindingRecords; webhook path still emits audit when correlation exists.
            Task.FromResult(0);
    }

    /// <inheritdoc />
    public Task<bool> FindingRecordExistsAsync(Guid tenantId, string findingId, CancellationToken ct)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (string.IsNullOrWhiteSpace(findingId)) throw new ArgumentException("findingId is required.", nameof(findingId));

        string trimmed = findingId.Trim();

        bool any = _byKey.Values.Any(r =>
            r.TenantId == tenantId &&
            string.Equals(r.FindingId, trimmed, StringComparison.Ordinal));

        return Task.FromResult(any);
    }

    private static string Key(string provider, string externalKey) =>
        $"{provider.Trim()}\u001f{externalKey.Trim()}";
}
