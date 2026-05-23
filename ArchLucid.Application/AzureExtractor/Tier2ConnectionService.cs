using System.Security.Cryptography;
using System.Text;

using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Application.AzureExtractor;

public interface ITier2ConnectionService
{
    Task<Tier2ConnectionSummary> ConfigureAsync(
        Guid tenantId,
        string actorId,
        Tier2ConnectionConfigureRequest request,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<Tier2ConnectionSummary>> ListConnectionsAsync(
        Guid tenantId,
        CancellationToken cancellationToken);
}

public sealed class Tier2ConnectionConfigureRequest
{
    public required string TenantIdAzure { get; init; }

    public required string ClientId { get; init; }

    public required string SubscriptionIds { get; init; }
}

public sealed class Tier2ConnectionSummary
{
    public Guid ConnectionId { get; init; }

    public required string TenantIdAzure { get; init; }

    public required string ClientId { get; init; }

    public required string SubscriptionIds { get; init; }

    public DateTimeOffset UpdatedUtc { get; init; }
}

public sealed class Tier2ConnectionService(
    ITenantHostedExtractorConfigurationRepository repository) : ITier2ConnectionService
{
    private readonly ITenantHostedExtractorConfigurationRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    public async Task<Tier2ConnectionSummary> ConfigureAsync(
        Guid tenantId,
        string actorId,
        Tier2ConnectionConfigureRequest request,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        ArgumentException.ThrowIfNullOrWhiteSpace(actorId);
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.TenantIdAzure);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.ClientId);
        ArgumentException.ThrowIfNullOrWhiteSpace(request.SubscriptionIds);

        IReadOnlyList<string> subscriptionIds = ParseSubscriptionIds(request.SubscriptionIds);
        TenantHostedExtractorConfigurationRecord? lastRecord = null;

        foreach (string subscriptionId in subscriptionIds)
        {
            TenantHostedExtractorConfigurationRecord record = new()
            {
                TenantId = tenantId,
                CustomerTenantId = request.TenantIdAzure.Trim(),
                CustomerAppId = request.ClientId.Trim(),
                SubscriptionId = subscriptionId,
                IncludeCost = true,
                UpdatedByActorId = actorId,
                UpdatedUtc = TimeProvider.System.GetUtcNow()
            };

            await _repository.UpsertAsync(record, cancellationToken).ConfigureAwait(false);
            lastRecord = record;
        }

        if (lastRecord is null)
            throw new ArgumentException("At least one subscription ID is required.", nameof(request));

        return ToSummary(lastRecord, string.Join(", ", subscriptionIds));
    }

    public async Task<IReadOnlyList<Tier2ConnectionSummary>> ListConnectionsAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        IReadOnlyList<TenantHostedExtractorConfigurationRecord> records =
            await _repository.ListByTenantAsync(tenantId, cancellationToken).ConfigureAwait(false);

        return records
            .Select(record => ToSummary(record, record.SubscriptionId))
            .ToList();
    }

    private static Tier2ConnectionSummary ToSummary(
        TenantHostedExtractorConfigurationRecord record,
        string subscriptionIdsDisplay) =>
        new()
        {
            ConnectionId = ToConnectionId(record.TenantId, record.SubscriptionId),
            TenantIdAzure = record.CustomerTenantId,
            ClientId = record.CustomerAppId,
            SubscriptionIds = subscriptionIdsDisplay,
            UpdatedUtc = record.UpdatedUtc
        };

    private static Guid ToConnectionId(Guid tenantId, string subscriptionId)
    {
        byte[] hash = SHA256.HashData(
            Encoding.UTF8.GetBytes($"{tenantId:N}:{subscriptionId.Trim().ToLowerInvariant()}"));

        return new Guid(hash.AsSpan(0, 16));
    }

    private static IReadOnlyList<string> ParseSubscriptionIds(string raw)
    {
        string[] parts = raw.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (parts.Length == 0)
            throw new ArgumentException("At least one subscription ID is required.", nameof(raw));

        List<string> normalized = new(parts.Length);

        foreach (string part in parts)
        {
            if (!Guid.TryParse(part, out _))
                throw new ArgumentException($"Subscription ID '{part}' must be a GUID.", nameof(raw));

            normalized.Add(part.ToLowerInvariant());
        }

        return normalized;
    }
}
