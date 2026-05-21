namespace ArchLucid.Core.AzureExtractor;

public interface ITenantHostedExtractorConfigurationRepository
{
    Task<TenantHostedExtractorConfigurationRecord?> TryGetAsync(
        Guid tenantId,
        string subscriptionId,
        CancellationToken cancellationToken);

    Task UpsertAsync(TenantHostedExtractorConfigurationRecord record, CancellationToken cancellationToken);
}
