using ArchLucid.Core.AzureExtractor;

namespace ArchLucid.Application.AzureExtractor;

public interface IHostedAzureExtractorConfigurationService
{
    Task<TenantHostedExtractorConfigurationRecord> ConfigureAsync(
        Guid tenantId,
        string actorId,
        HostedAzureExtractorConfigureRequest request,
        CancellationToken cancellationToken);
}

public sealed class HostedAzureExtractorConfigurationService(
    ITenantHostedExtractorConfigurationRepository repository) : IHostedAzureExtractorConfigurationService
{
    private readonly ITenantHostedExtractorConfigurationRepository _repository =
        repository ?? throw new ArgumentNullException(nameof(repository));

    public async Task<TenantHostedExtractorConfigurationRecord> ConfigureAsync(
        Guid tenantId,
        string actorId,
        HostedAzureExtractorConfigureRequest request,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(request);
        ArgumentException.ThrowIfNullOrWhiteSpace(actorId);
        ValidateGuidLike(request.CustomerTenantId, nameof(request.CustomerTenantId));
        ValidateGuidLike(request.CustomerAppId, nameof(request.CustomerAppId));
        ValidateGuidLike(request.SubscriptionId, nameof(request.SubscriptionId));

        TenantHostedExtractorConfigurationRecord record = new()
        {
            TenantId = tenantId,
            CustomerTenantId = request.CustomerTenantId.Trim(),
            CustomerAppId = request.CustomerAppId.Trim(),
            SubscriptionId = request.SubscriptionId.Trim(),
            IncludeCost = request.IncludeCost,
            UpdatedUtc = TimeProvider.System.GetUtcNow(),
            UpdatedByActorId = actorId
        };

        await _repository.UpsertAsync(record, cancellationToken).ConfigureAwait(false);

        return record;
    }

    private static void ValidateGuidLike(string value, string paramName)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(value);

        if (!Guid.TryParse(value.Trim(), out _))
            throw new ArgumentException($"{paramName} must be a GUID.", paramName);
    }
}

public sealed class HostedAzureExtractorConfigureRequest
{
    public required string CustomerTenantId { get; init; }

    public required string CustomerAppId { get; init; }

    public required string SubscriptionId { get; init; }

    public bool IncludeCost { get; init; }
}
