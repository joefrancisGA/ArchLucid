using ArchLucid.Persistence.Archival;

using Azure;
using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Persistence.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentTraceOrphanBlobDeleterTests
{
    [Fact]
    public async Task DeleteAzureOrphanBlobsAsync_counts_only_blobs_marked_for_deletion()
    {
        Mock<BlobContainerClient> container = new(MockBehavior.Strict);
        container.Setup(client => client.DeleteBlobIfExistsAsync(
                "already-missing", DeleteSnapshotsOption.IncludeSnapshots, null, CancellationToken.None))
            .ReturnsAsync(Response.FromValue(false, Mock.Of<Response>()));
        container.Setup(client => client.DeleteBlobIfExistsAsync(
                "still-present", DeleteSnapshotsOption.IncludeSnapshots, null, CancellationToken.None))
            .ReturnsAsync(Response.FromValue(true, Mock.Of<Response>()));

        int deleted = await AgentTraceOrphanBlobDeleter.DeleteAzureOrphanBlobsAsync(
            container.Object, ["already-missing", "still-present"], CancellationToken.None);

        deleted.Should().Be(1);
        container.Verify(client => client.DeleteBlobIfExistsAsync(
            "already-missing", DeleteSnapshotsOption.IncludeSnapshots, null, CancellationToken.None), Times.Once);
        container.Verify(client => client.DeleteBlobIfExistsAsync(
            "still-present", DeleteSnapshotsOption.IncludeSnapshots, null, CancellationToken.None), Times.Once);
        container.VerifyNoOtherCalls();
    }
}
