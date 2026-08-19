using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RoiCostEvidenceCollectionResolverTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
        WorkspaceId = Guid.Parse("11111111-2222-3333-4444-555555555555"),
        ProjectId = Guid.Parse("22222222-3333-4444-5555-666666666666"),
    };

    [Fact]
    public async Task HasAnyUploadedInventoryPackagesAsync_when_only_aws_download_exists_returns_true()
    {
        Mock<IAzureExtractorPackageRepository> azureRepository = new();
        azureRepository
            .Setup(repo => repo.HasAnyInWorkspaceAsync(Scope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        Mock<ICloudInventoryExtractorPackageRepository> cloudRepository = new();
        cloudRepository
            .Setup(repo => repo.TryGetLatestDownloadInScopeAsync(Scope, CloudProvider.Aws, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CloudInventoryExtractorPackageDownloadRecord());
        cloudRepository
            .Setup(repo => repo.TryGetLatestDownloadInScopeAsync(Scope, CloudProvider.Gcp, It.IsAny<CancellationToken>()))
            .ReturnsAsync((CloudInventoryExtractorPackageDownloadRecord?)null);

        RoiCostEvidenceCollectionResolver sut = new(azureRepository.Object, cloudRepository.Object);

        bool hasPackages = await sut.HasAnyUploadedInventoryPackagesAsync(Scope, CancellationToken.None);

        hasPackages.Should().BeTrue();
    }

    [Fact]
    public async Task TryResolveLatestCollectionTimestampUtcAsync_prefers_run_linked_aws_provenance()
    {
        Guid runId = Guid.Parse("33333333-4444-5555-6666-777777777777");
        DateTime awsRunUtc = new(2026, 5, 20, 12, 0, 0, DateTimeKind.Utc);
        DateTime scopeAzureUtc = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);

        Mock<IAzureExtractorPackageRepository> azureRepository = new();
        azureRepository
            .Setup(repo => repo.TryGetLatestProvenanceByRunIdAsync(Scope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((AzureExtractorPackageProvenance?)null);
        azureRepository
            .Setup(repo => repo.TryGetLatestCollectionTimestampUtcInScopeAsync(Scope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(scopeAzureUtc);

        Mock<ICloudInventoryExtractorPackageRepository> cloudRepository = new();
        cloudRepository
            .Setup(repo => repo.TryGetLatestProvenanceByRunIdAsync(Scope, runId, CloudProvider.Aws, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CloudInventoryExtractorPackageProvenance { CollectionTimestampUtc = awsRunUtc });
        cloudRepository
            .Setup(repo => repo.TryGetLatestProvenanceByRunIdAsync(Scope, runId, CloudProvider.Gcp, It.IsAny<CancellationToken>()))
            .ReturnsAsync((CloudInventoryExtractorPackageProvenance?)null);

        RoiCostEvidenceCollectionResolver sut = new(azureRepository.Object, cloudRepository.Object);

        DateTime? resolvedUtc = await sut.TryResolveLatestCollectionTimestampUtcAsync(
            Scope,
            runId.ToString("N"),
            CancellationToken.None);

        resolvedUtc.Should().Be(awsRunUtc);
    }

    [Fact]
    public async Task TryGetLatestCollectionTimestampUtcInScopeAsync_returns_newest_across_providers()
    {
        DateTime azureUtc = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime awsUtc = new(2026, 5, 10, 0, 0, 0, DateTimeKind.Utc);
        DateTime gcpUtc = new(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc);

        Mock<IAzureExtractorPackageRepository> azureRepository = new();
        azureRepository
            .Setup(repo => repo.TryGetLatestCollectionTimestampUtcInScopeAsync(Scope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(azureUtc);

        Mock<ICloudInventoryExtractorPackageRepository> cloudRepository = new();
        cloudRepository
            .Setup(repo => repo.TryGetLatestCollectionTimestampUtcInScopeAsync(Scope, CloudProvider.Aws, It.IsAny<CancellationToken>()))
            .ReturnsAsync(awsUtc);
        cloudRepository
            .Setup(repo => repo.TryGetLatestCollectionTimestampUtcInScopeAsync(Scope, CloudProvider.Gcp, It.IsAny<CancellationToken>()))
            .ReturnsAsync(gcpUtc);

        RoiCostEvidenceCollectionResolver sut = new(azureRepository.Object, cloudRepository.Object);

        DateTime? resolvedUtc = await sut.TryGetLatestCollectionTimestampUtcInScopeAsync(Scope, CancellationToken.None);

        resolvedUtc.Should().Be(awsUtc);
    }
}
