using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Tenancy;

using Azure.Storage.Blobs;

using FluentAssertions;

using Moq;

namespace ArchLucid.Persistence.Tests.BlobStore;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TenantRegionalArtifactBlobClientsTests
{
    [Fact]
    public async Task Routes_non_default_DataRegion_through_regional_binding_map()
    {
        Guid tenantId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        TenantRecord tenant = new()
        {
            Id = tenantId,
            Name = "Regional",
            Slug = "regional",
            Tier = TenantTier.Standard,
            DataRegion = " EastUS ",
            CreatedUtc = DateTimeOffset.UtcNow,
        };

        Mock<ITenantRepository> repo = new();
        repo.Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);

        Uri eastStore = new("https://eastus-regional.blob.core.windows.net");

        ArtifactLargePayloadOptions options =
            new()
            {
                BlobProvider = "AzureBlob",
                AzureBlobServiceUri = "https://defaultacct.blob.core.windows.net",
                AzureBlobServiceUriByRegion = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)

                    { ["eastus"] = eastStore.AbsoluteUri, },
            };

        RegionalArtifactBlobClientFactory factory =
            new(new StubArtifactLargePayloadOptionsMonitor(options), new StaticBearerTokenCredential());
        TenantRegionalArtifactBlobClients sut = new(factory, repo.Object);

        BlobServiceClient client = await sut.GetArtifactsBlobServiceClientAsync(tenantId, CancellationToken.None);

        client.Uri.Host.Should().Be(eastStore.Host);

        repo.Verify(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task Null_tenant_fallback_uses_default_blob_URI()
    {
        Guid tenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<ITenantRepository> repo = new();

        repo.Setup(r => r.GetByIdAsync(tenantId, It.IsAny<CancellationToken>())).ReturnsAsync((TenantRecord?)null);

        const string primary = "https://homeacct.blob.core.windows.net/";

        ArtifactLargePayloadOptions snapshot =
            new() { BlobProvider = "AzureBlob", AzureBlobServiceUri = primary, };

        RegionalArtifactBlobClientFactory factory =
            new(new StubArtifactLargePayloadOptionsMonitor(snapshot), new StaticBearerTokenCredential());
        TenantRegionalArtifactBlobClients sut = new(factory, repo.Object);

        BlobServiceClient client = await sut.GetArtifactsBlobServiceClientAsync(tenantId, CancellationToken.None);

        Uri expected = new Uri(primary.Trim());
        client.Uri.GetLeftPart(UriPartial.Authority).Should().Be(expected.GetLeftPart(UriPartial.Authority));
    }
}
