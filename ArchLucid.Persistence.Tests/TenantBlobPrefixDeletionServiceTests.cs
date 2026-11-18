using ArchLucid.Persistence.BlobStore;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
public sealed class TenantBlobPrefixDeletionServiceTests
{
    [Fact]
    public async Task Canceled_local_cleanup_preserves_all_tenant_files()
    {
        using CancellationTokenSource cancellation = new();
        string root = Directory.CreateTempSubdirectory().FullName;
        try
        {
            Guid tenantId = Guid.NewGuid();
            string tenantDirectory = Path.Combine(root, "artifact-bundles",
                ArtifactBlobTenantPaths.TenantPrefixDirectorySegment(tenantId).TrimEnd('/'));
            Directory.CreateDirectory(tenantDirectory);
            string payload = Path.Combine(tenantDirectory, "payload.json");
            await File.WriteAllTextAsync(payload, "{}");
            Mock<IOptionsMonitor<ArtifactLargePayloadOptions>> options = new();
            options.SetupGet(o => o.CurrentValue).Returns(new ArtifactLargePayloadOptions
            {
                BlobProvider = "Local",
                LocalRootPath = root,
            });
            TenantBlobPrefixDeletionService service = new(options.Object, regionalClients: null);
            cancellation.Cancel();

            Func<Task> cleanup = () => service.DeleteAllTenantPrefixesAsync(tenantId, cancellation.Token);
            await cleanup.Should().ThrowAsync<OperationCanceledException>();
            File.Exists(payload).Should().BeTrue();
        }
        finally
        {
            Directory.Delete(root, recursive: true);
        }
    }
}
