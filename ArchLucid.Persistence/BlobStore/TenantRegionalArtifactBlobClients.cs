using ArchLucid.Core.Tenancy;

using Azure.Storage.Blobs;

namespace ArchLucid.Persistence.BlobStore;

public sealed class TenantRegionalArtifactBlobClients(
    RegionalArtifactBlobClientFactory clientFactory,
    ITenantRepository tenantRepository) : ITenantRegionalArtifactBlobClients
{
    private readonly RegionalArtifactBlobClientFactory _clientFactory =
        clientFactory ?? throw new ArgumentNullException(nameof(clientFactory));

    private readonly ITenantRepository _tenantRepository =
        tenantRepository ?? throw new ArgumentNullException(nameof(tenantRepository));

    public async Task<BlobServiceClient> GetArtifactsBlobServiceClientAsync(Guid tenantId, CancellationToken ct)
    {
        TenantRecord? tenant = await _tenantRepository.GetByIdAsync(tenantId, ct);

        string region =
            tenant is null ? TenantDataRegions.Default : TenantDataRegions.NormalizeOptional(tenant.DataRegion);

        return _clientFactory.Resolve(region);
    }
}
