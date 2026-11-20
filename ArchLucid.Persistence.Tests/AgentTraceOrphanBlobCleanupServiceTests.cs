using ArchLucid.Persistence.Archival;
using ArchLucid.Persistence.BlobStore;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Persistence.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentTraceOrphanBlobCleanupServiceTests
{
    [Fact]
    public async Task Local_cleanup_prunes_orphan_run_but_preserves_container_and_configured_root()
    {
        string fixtureRoot = Directory.CreateTempSubdirectory().FullName;
        try
        {
            await File.WriteAllTextAsync(Path.Combine(fixtureRoot, "fixture-marker"), string.Empty);
            string testDirectory = Path.Combine(fixtureRoot, "working");
            Guid tenantId = Guid.NewGuid();
            Guid runId = Guid.NewGuid();
            string root = Path.Combine(testDirectory, "blob-store");
            string containerDir = Path.Combine(root, "agent-traces");
            string tenantDirectory = Path.Combine(containerDir, tenantId.ToString("D"));
            string runDirectory = Path.Combine(tenantDirectory, runId.ToString("D"));
            Directory.CreateDirectory(runDirectory);
            string blobPath = Path.Combine(runDirectory, "trace.txt");
            await File.WriteAllTextAsync(blobPath, "orphan trace");
            File.SetLastWriteTimeUtc(blobPath, DateTime.UtcNow.AddDays(-2));

            Mock<IRunRepository> runs = new(MockBehavior.Strict);
            runs.Setup(r => r.GetByRunIdAdminAsync(runId, CancellationToken.None))
                .ReturnsAsync((RunRecord?)null);
            Mock<IOptionsMonitor<ArtifactLargePayloadOptions>> options = new();
            options.SetupGet(o => o.CurrentValue).Returns(new ArtifactLargePayloadOptions
            {
                BlobProvider = "Local",
                LocalRootPath = root
            });
            AgentTraceOrphanBlobCleanupService service = new(
                runs.Object, options.Object, null, null, NullLogger<AgentTraceOrphanBlobCleanupService>.Instance);

            int deleted = await service.DeleteOrphanedBlobsAsync(
                new DataArchivalBlobCleanupOptions { Enabled = true, MinAgeDays = 1 }, CancellationToken.None);

            deleted.Should().Be(1);
            File.Exists(blobPath).Should().BeFalse();
            Directory.Exists(runDirectory).Should().BeFalse();
            Directory.Exists(tenantDirectory).Should().BeFalse();
            Directory.Exists(containerDir).Should().BeTrue();
            Directory.Exists(root).Should().BeTrue();
            Directory.Exists(testDirectory).Should().BeTrue();
        }
        finally
        {
            Directory.Delete(fixtureRoot, recursive: true);
        }
    }
}
