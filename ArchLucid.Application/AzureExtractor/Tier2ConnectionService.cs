using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Application.AzureExtractor;

public interface ITier2ConnectionService
{
    Task<TenantCloudConnectionRecord> ConfigureAsync(
        Guid tenantId,
        string actorId,
        Tier2ConnectionConfigureRequest request,
        CancellationToken cancellationToken);

    Task<IReadOnlyList<TenantCloudConnectionRecord>> ListConnectionsAsync(
        Guid tenantId,
        CancellationToken cancellationToken);
}

public sealed class Tier2ConnectionConfigureRequest
{
    public required string TenantIdAzure { get; init; }
    public required string ClientId { get; init; }
    public required string SubscriptionIds { get; init; }
}

public sealed class Tier2ConnectionService(
    ITenantCloudConnectionRepository repository) : ITier2ConnectionService
{
    private readonly ITenantCloudConnectionRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    public async Task<TenantCloudConnectionRecord> ConfigureAsync(
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

        var record = new TenantCloudConnectionRecord
        {
            ConnectionId = Guid.NewGuid(),
            TenantId = tenantId,
            TenantIdAzure = request.TenantIdAzure.Trim(),
            ClientId = request.ClientId.Trim(),
            SubscriptionIds = request.SubscriptionIds.Trim(),
            UpdatedByActorId = actorId,
            UpdatedUtc = DateTimeOffset.UtcNow
        };

        await _repository.UpsertAsync(record, cancellationToken).ConfigureAwait(false);

        return record;
    }

    public Task<IReadOnlyList<TenantCloudConnectionRecord>> ListConnectionsAsync(
        Guid tenantId,
        CancellationToken cancellationToken)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        return _repository.ListByTenantAsync(tenantId, cancellationToken);
    }
}
