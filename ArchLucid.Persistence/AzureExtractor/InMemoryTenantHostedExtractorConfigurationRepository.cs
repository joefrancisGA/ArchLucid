using System.Collections.Concurrent;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Persistence.AzureExtractor;

[ExcludeFromCodeCoverage(Justification = "In-memory store for dev/test hosts.")]
public sealed class InMemoryTenantHostedExtractorConfigurationRepository
    : ITenantHostedExtractorConfigurationRepository
{
    private readonly ConcurrentDictionary<(Guid TenantId, string SubscriptionId), TenantHostedExtractorConfigurationRecord> _rows =
        new();

    public Task<TenantHostedExtractorConfigurationRecord?> TryGetAsync(
        Guid tenantId,
        string subscriptionId,
        CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        string normalizedSubscriptionId = NormalizeSubscriptionId(subscriptionId);

        _rows.TryGetValue((tenantId, normalizedSubscriptionId), out TenantHostedExtractorConfigurationRecord? row);

        return Task.FromResult(row);
    }

    public Task UpsertAsync(TenantHostedExtractorConfigurationRecord record, CancellationToken cancellationToken)
    {
        _ = cancellationToken;

        string normalizedSubscriptionId = NormalizeSubscriptionId(record.SubscriptionId);

        _rows[(record.TenantId, normalizedSubscriptionId)] = new TenantHostedExtractorConfigurationRecord
        {
            TenantId = record.TenantId,
            CustomerTenantId = record.CustomerTenantId,
            CustomerAppId = record.CustomerAppId,
            SubscriptionId = normalizedSubscriptionId,
            IncludeCost = record.IncludeCost,
            UpdatedUtc = record.UpdatedUtc,
            UpdatedByActorId = record.UpdatedByActorId
        };

        return Task.CompletedTask;
    }

    private static string NormalizeSubscriptionId(string subscriptionId) =>
        subscriptionId.Trim().ToLowerInvariant();
}
