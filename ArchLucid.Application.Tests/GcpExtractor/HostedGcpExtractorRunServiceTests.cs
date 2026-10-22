using ArchLucid.Application.CloudInventoryExtractor;
using ArchLucid.Application.GcpExtractor;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.GcpExtractor;
using ArchLucid.Core.Scoping;
using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Contracts.Common;
using ArchLucid.Persistence.GcpExtractor;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.GcpExtractor;

[Trait("Category", "Unit")]
public sealed class HostedGcpExtractorRunServiceTests
{
    [Fact]
    public async Task RunAsync_when_disabled_returns_feature_disabled()
    {
        Mock<IOptionsMonitor<HostedGcpExtractorOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new HostedGcpExtractorOptions { Enabled = false });

        HostedGcpExtractorRunService sut = CreateSut(options: options.Object);

        HostedGcpExtractorRunResult result = await sut.RunAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            null,
            "actor",
            null,
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.FailureKind.Should().Be(HostedGcpExtractorRunFailureKind.FeatureDisabled);
    }

    [Fact]
    public async Task RunAsync_when_configured_collects_and_ingests()
    {
        Guid tenantId = Guid.NewGuid();
        Guid connectionId = Guid.NewGuid();
        Guid packageId = Guid.NewGuid();

        InMemoryTenantGcpConnectionRepository connectionRepository = new();
        await connectionRepository.UpsertAsync(
            new TenantGcpConnectionRecord
            {
                ConnectionId = connectionId,
                TenantId = tenantId,
                ProjectId = "my-gcp-project",
                WorkloadIdentityPoolProvider = "projects/123/locations/global/workloadIdentityPools/pool/providers/azure",
                ServiceAccountEmail = "readonly@my-gcp-project.iam.gserviceaccount.com",
                Status = GcpConnectionStatus.Connected,
                CreatedUtc = DateTimeOffset.UtcNow,
                UpdatedUtc = DateTimeOffset.UtcNow,
                UpdatedByActorId = "seed"
            },
            CancellationToken.None);

        Mock<IHostedGcpExtractorClient> client = new();
        client
            .Setup(c => c.CollectZipAsync(It.IsAny<HostedGcpExtractorCollectionRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HostedGcpExtractorCollectionResult
            {
                ZipBytes = [1, 2, 3],
                OriginalFileName = "gcp-inventory.zip",
                ResourceCount = 5
            });

        Mock<ICloudInventoryExtractorIngestService> ingest = new();
        ingest
            .Setup(i => i.IngestZipAsync(
                CloudProvider.Gcp,
                It.IsAny<IFormFile>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<string?>()))
            .ReturnsAsync(new CloudInventoryExtractorIngestResult { Succeeded = true, PackageId = packageId });

        Mock<IOptionsMonitor<HostedGcpExtractorOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new HostedGcpExtractorOptions { Enabled = true });

        HostedGcpExtractorRunService sut = CreateSut(
            connectionRepository,
            client.Object,
            ingest.Object,
            options.Object);

        HostedGcpExtractorRunResult result = await sut.RunAsync(
            tenantId,
            connectionId,
            null,
            "actor",
            "corr",
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.PackageId.Should().Be(packageId);
        result.ResourceCount.Should().Be(5);
    }

    private static HostedGcpExtractorRunService CreateSut(
        ITenantGcpConnectionRepository? connectionRepository = null,
        IHostedGcpExtractorClient? hostedClient = null,
        ICloudInventoryExtractorIngestService? ingestService = null,
        IOptionsMonitor<HostedGcpExtractorOptions>? options = null)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        });

        Mock<IOptionsMonitor<HostedGcpExtractorOptions>> defaultOptions = new();
        defaultOptions.Setup(o => o.CurrentValue).Returns(new HostedGcpExtractorOptions { Enabled = false });

        return new HostedGcpExtractorRunService(
            connectionRepository ?? Mock.Of<ITenantGcpConnectionRepository>(),
            hostedClient ?? Mock.Of<IHostedGcpExtractorClient>(),
            ingestService ?? Mock.Of<ICloudInventoryExtractorIngestService>(),
            scope.Object,
            Mock.Of<IAuditService>(),
            options ?? defaultOptions.Object);
    }
}
