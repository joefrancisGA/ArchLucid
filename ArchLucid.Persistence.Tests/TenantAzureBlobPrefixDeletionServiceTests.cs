using ArchLucid.Persistence.BlobStore;

using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
public sealed class TenantAzureBlobPrefixDeletionServiceTests
{
    [Fact]
    public async Task Missing_container_does_not_skip_later_containers()
    {
        Mock<IOptionsMonitor<ArtifactLargePayloadOptions>> options = new();
        options.SetupGet(o => o.CurrentValue).Returns(new ArtifactLargePayloadOptions { BlobProvider = "AzureBlob" });
        Mock<BlobServiceClient> service = new();
        Mock<BlobContainerClient> missing = new();
        Mock<BlobContainerClient> remaining = new();
        missing.Setup(c => c.GetBlobsAsync(
                BlobTraits.None, BlobStates.All, It.IsAny<string>(), CancellationToken.None))
            .Throws(new RequestFailedException(404, "Missing container", "ContainerNotFound", null));
        remaining.Setup(c => c.GetBlobsAsync(
                BlobTraits.None, BlobStates.All, It.IsAny<string>(), CancellationToken.None))
            .Returns(AsyncPageable<BlobItem>.FromPages([]));
        service.Setup(c => c.GetBlobContainerClient("golden-manifests")).Returns(missing.Object);
        service.Setup(c => c.GetBlobContainerClient("artifact-bundles")).Returns(remaining.Object);
        service.Setup(c => c.GetBlobContainerClient("agent-traces")).Returns(remaining.Object);
        TenantBlobPrefixDeletionService cleanup = new(options.Object, regionalClients: null, blobServiceClient: service.Object);

        var result = await cleanup.DeleteAllTenantPrefixesAsync(Guid.NewGuid(), CancellationToken.None);

        result.BlobsDeletedByContainer.Should().HaveCount(3);
        result.BlobsDeletedByContainer["golden-manifests"].Should().Be(0);
        service.Verify(c => c.GetBlobContainerClient("agent-traces"), Times.Once);
    }
}
