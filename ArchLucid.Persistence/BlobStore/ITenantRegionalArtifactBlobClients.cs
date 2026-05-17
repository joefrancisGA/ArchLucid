using ArchLucid.Core.Tenancy;

using Azure.Storage.Blobs;

namespace ArchLucid.Persistence.BlobStore;

/// <summary>Resolves ArtifactLargePayload <see cref="BlobServiceClient" /> using <see cref="Tenancy.ITenantRepository" /> + regional factory.</summary>
public interface ITenantRegionalArtifactBlobClients
{
    Task<BlobServiceClient> GetArtifactsBlobServiceClientAsync(Guid tenantId, CancellationToken ct);
}
