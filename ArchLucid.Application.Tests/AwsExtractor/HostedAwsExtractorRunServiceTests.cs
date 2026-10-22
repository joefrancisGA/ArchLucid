using System.IO.Compression;
using System.Text.Json;

using ArchLucid.Application.CloudInventoryExtractor;
using ArchLucid.Application.AwsExtractor;
using ArchLucid.Core.Audit;
using ArchLucid.Core.AwsExtractor;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Contracts.Abstractions.Integrations;
using ArchLucid.Contracts.Common;

using Microsoft.AspNetCore.Http;
using ArchLucid.Persistence.AwsExtractor;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.AwsExtractor;

[Trait("Category", "Unit")]
public sealed class HostedAwsExtractorRunServiceTests
{
    [Fact]
    public async Task RunAsync_when_disabled_returns_feature_disabled()
    {
        Mock<IOptionsMonitor<HostedAwsExtractorOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new HostedAwsExtractorOptions { Enabled = false });

        HostedAwsExtractorRunService sut = CreateSut(options: options.Object);

        HostedAwsExtractorRunResult result = await sut.RunAsync(
            Guid.NewGuid(),
            Guid.NewGuid(),
            null,
            "actor",
            null,
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.FailureKind.Should().Be(HostedAwsExtractorRunFailureKind.FeatureDisabled);
    }

    [Fact]
    public async Task RunAsync_when_configured_collects_and_ingests()
    {
        Guid tenantId = Guid.NewGuid();
        Guid connectionId = Guid.NewGuid();
        Guid packageId = Guid.NewGuid();

        InMemoryTenantAwsConnectionRepository connectionRepository = new();
        await connectionRepository.UpsertAsync(
            new TenantAwsConnectionRecord
            {
                ConnectionId = connectionId,
                TenantId = tenantId,
                AccountId = "123456789012",
                Region = "us-east-1",
                RoleArn = "arn:aws:iam::123456789012:role/ReadOnly",
                Status = AwsConnectionStatus.Connected,
                CreatedUtc = DateTimeOffset.UtcNow,
                UpdatedUtc = DateTimeOffset.UtcNow,
                UpdatedByActorId = "seed"
            },
            CancellationToken.None);

        Mock<IHostedAwsExtractorClient> client = new();
        client
            .Setup(c => c.CollectZipAsync(It.IsAny<HostedAwsExtractorCollectionRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HostedAwsExtractorCollectionResult
            {
                ZipBytes = [1, 2, 3],
                OriginalFileName = "aws-inventory.zip",
                ResourceCount = 7
            });

        Mock<ICloudInventoryExtractorIngestService> ingest = new();
        ingest
            .Setup(i => i.IngestZipAsync(
                CloudProvider.Aws,
                It.IsAny<IFormFile>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<string?>()))
            .ReturnsAsync(new CloudInventoryExtractorIngestResult { Succeeded = true, PackageId = packageId });

        Mock<IOptionsMonitor<HostedAwsExtractorOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new HostedAwsExtractorOptions { Enabled = true });

        HostedAwsExtractorRunService sut = CreateSut(
            connectionRepository,
            client.Object,
            ingest.Object,
            options.Object);

        HostedAwsExtractorRunResult result = await sut.RunAsync(
            tenantId,
            connectionId,
            null,
            "actor",
            "corr",
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.PackageId.Should().Be(packageId);
        result.ResourceCount.Should().Be(7);
    }

    private static HostedAwsExtractorRunService CreateSut(
        ITenantAwsConnectionRepository? connectionRepository = null,
        IHostedAwsExtractorClient? hostedClient = null,
        ICloudInventoryExtractorIngestService? ingestService = null,
        IOptionsMonitor<HostedAwsExtractorOptions>? options = null)
    {
        Mock<IScopeContextProvider> scope = new();
        scope.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid()
        });

        Mock<IOptionsMonitor<HostedAwsExtractorOptions>> defaultOptions = new();
        defaultOptions.Setup(o => o.CurrentValue).Returns(new HostedAwsExtractorOptions { Enabled = false });

        return new HostedAwsExtractorRunService(
            connectionRepository ?? Mock.Of<ITenantAwsConnectionRepository>(),
            hostedClient ?? Mock.Of<IHostedAwsExtractorClient>(),
            ingestService ?? Mock.Of<ICloudInventoryExtractorIngestService>(),
            scope.Object,
            Mock.Of<IAuditService>(),
            options ?? defaultOptions.Object);
    }
}
