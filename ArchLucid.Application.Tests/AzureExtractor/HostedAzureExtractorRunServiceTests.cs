using ArchLucid.Application.AzureExtractor;
using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.Configuration;
using ArchLucid.Contracts.Abstractions.Integrations;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.AzureExtractor;

[Trait("Category", "Unit")]
public sealed class HostedAzureExtractorRunServiceTests
{
    [Fact]
    public async Task RunAsync_when_disabled_returns_feature_disabled()
    {
        Mock<IOptionsMonitor<HostedAzureExtractorOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new HostedAzureExtractorOptions { Enabled = false });

        HostedAzureExtractorRunService sut = new(
            Mock.Of<ITenantHostedExtractorConfigurationRepository>(),
            Mock.Of<IHostedAzureExtractorClient>(),
            Mock.Of<IAzureExtractorIngestService>(),
            options.Object);

        HostedAzureExtractorRunResult result = await sut.RunAsync(
            Guid.NewGuid(),
            "sub-1",
            null,
            "actor",
            null,
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.FailureKind.Should().Be(HostedAzureExtractorRunFailureKind.FeatureDisabled);
    }

    [Fact]
    public async Task RunAsync_when_configured_collects_and_ingests()
    {
        Guid tenantId = Guid.NewGuid();
        Guid packageId = Guid.NewGuid();

        Mock<ITenantHostedExtractorConfigurationRepository> configRepo = new();
        configRepo
            .Setup(r => r.TryGetAsync(tenantId, "sub-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new TenantHostedExtractorConfigurationRecord
            {
                CustomerTenantId = "cust",
                CustomerAppId = "app",
                SubscriptionId = "sub-1",
                IncludeCost = true,
            });

        Mock<IHostedAzureExtractorClient> client = new();
        client
            .Setup(c => c.CollectZipAsync(It.IsAny<HostedAzureExtractorCollectionRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new HostedAzureExtractorCollectionResult
            {
                ZipBytes = [1, 2, 3],
                OriginalFileName = "extract.zip",
                ResourceCount = 4,
            });

        Mock<IAzureExtractorIngestService> ingest = new();
        ingest
            .Setup(i => i.IngestZipBytesAsync(
                It.IsAny<byte[]>(),
                It.IsAny<string>(),
                It.IsAny<Guid?>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<string?>(),
                It.IsAny<long>()))
            .ReturnsAsync(new AzureExtractorIngestResult { Succeeded = true, PackageId = packageId });

        Mock<IOptionsMonitor<HostedAzureExtractorOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new HostedAzureExtractorOptions { Enabled = true });

        HostedAzureExtractorRunService sut = new(
            configRepo.Object,
            client.Object,
            ingest.Object,
            options.Object);

        HostedAzureExtractorRunResult result = await sut.RunAsync(
            tenantId,
            "sub-1",
            null,
            "actor",
            "corr",
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.PackageId.Should().Be(packageId);
        result.ResourceCount.Should().Be(4);
    }
}
