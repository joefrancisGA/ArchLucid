using ArchLucid.Application.Roi;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Roi;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Roi;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RoiCostEvidenceFreshnessEvaluatorTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
        WorkspaceId = Guid.Parse("11111111-2222-3333-4444-555555555555"),
        ProjectId = Guid.Parse("22222222-3333-4444-5555-666666666666"),
    };

    [Fact]
    public async Task EvaluateAsync_when_no_collection_timestamp_returns_missing()
    {
        RoiCostEvidenceFreshnessEvaluator sut = CreateSut(TimeProvider.System);

        RoiCostEvidenceFreshnessSnapshot snapshot = await sut.EvaluateAsync(CancellationToken.None);

        snapshot.Status.Should().Be(RoiCostEvidenceFreshness.Missing);
        snapshot.LatestCollectionTimestampUtc.Should().BeNull();
        snapshot.StaleAfterDays.Should().Be(90);
    }

    [Fact]
    public async Task EvaluateAsync_when_recent_collection_returns_fresh()
    {
        DateTime collectionUtc = new(2026, 5, 20, 12, 0, 0, DateTimeKind.Utc);
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 5, 26, 0, 0, 0, TimeSpan.Zero));
        RoiCostEvidenceFreshnessEvaluator sut = CreateSut(clock, azureCollectionUtc: collectionUtc);

        RoiCostEvidenceFreshnessSnapshot snapshot = await sut.EvaluateAsync(CancellationToken.None);

        snapshot.Status.Should().Be(RoiCostEvidenceFreshness.Fresh);
        snapshot.LatestCollectionTimestampUtc.Should().Be(collectionUtc);
    }

    [Fact]
    public async Task EvaluateAsync_when_collection_older_than_threshold_returns_stale()
    {
        DateTime collectionUtc = new(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 5, 26, 0, 0, 0, TimeSpan.Zero));
        RoiCostEvidenceFreshnessEvaluator sut = CreateSut(clock, azureCollectionUtc: collectionUtc);

        RoiCostEvidenceFreshnessSnapshot snapshot = await sut.EvaluateAsync(CancellationToken.None);

        snapshot.Status.Should().Be(RoiCostEvidenceFreshness.Stale);
    }

    [Fact]
    public async Task EvaluateAsync_uses_newest_timestamp_across_azure_aws_and_gcp_packages()
    {
        DateTime azureCollectionUtc = new(2026, 4, 1, 0, 0, 0, DateTimeKind.Utc);
        DateTime awsCollectionUtc = new(2026, 5, 10, 0, 0, 0, DateTimeKind.Utc);
        DateTime gcpCollectionUtc = new(2026, 5, 1, 0, 0, 0, DateTimeKind.Utc);
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 5, 26, 0, 0, 0, TimeSpan.Zero));

        RoiCostEvidenceFreshnessEvaluator sut = CreateSut(
            clock,
            azureCollectionUtc: azureCollectionUtc,
            awsCollectionUtc: awsCollectionUtc,
            gcpCollectionUtc: gcpCollectionUtc);

        RoiCostEvidenceFreshnessSnapshot snapshot = await sut.EvaluateAsync(CancellationToken.None);

        snapshot.Status.Should().Be(RoiCostEvidenceFreshness.Fresh);
        snapshot.LatestCollectionTimestampUtc.Should().Be(awsCollectionUtc);
    }

    [Fact]
    public async Task EvaluateAsync_when_only_aws_inventory_exists_uses_aws_timestamp()
    {
        DateTime awsCollectionUtc = new(2026, 5, 20, 12, 0, 0, DateTimeKind.Utc);
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 5, 26, 0, 0, 0, TimeSpan.Zero));

        RoiCostEvidenceFreshnessEvaluator sut = CreateSut(clock, awsCollectionUtc: awsCollectionUtc);

        RoiCostEvidenceFreshnessSnapshot snapshot = await sut.EvaluateAsync(CancellationToken.None);

        snapshot.Status.Should().Be(RoiCostEvidenceFreshness.Fresh);
        snapshot.LatestCollectionTimestampUtc.Should().Be(awsCollectionUtc);
    }

    private static RoiCostEvidenceFreshnessEvaluator CreateSut(
        TimeProvider clock,
        DateTime? azureCollectionUtc = null,
        DateTime? awsCollectionUtc = null,
        DateTime? gcpCollectionUtc = null)
    {
        Mock<IAzureExtractorPackageRepository> azureRepository = new();
        azureRepository
            .Setup(repo => repo.TryGetLatestCollectionTimestampUtcInScopeAsync(Scope, It.IsAny<CancellationToken>()))
            .ReturnsAsync(azureCollectionUtc);

        Mock<ICloudInventoryExtractorPackageRepository> cloudInventoryRepository = new();
        cloudInventoryRepository
            .Setup(repo => repo.TryGetLatestCollectionTimestampUtcInScopeAsync(
                Scope,
                CloudProvider.Aws,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(awsCollectionUtc);
        cloudInventoryRepository
            .Setup(repo => repo.TryGetLatestCollectionTimestampUtcInScopeAsync(
                Scope,
                CloudProvider.Gcp,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(gcpCollectionUtc);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(provider => provider.GetCurrentScope()).Returns(Scope);

        return new RoiCostEvidenceFreshnessEvaluator(
            azureRepository.Object,
            cloudInventoryRepository.Object,
            scopeProvider.Object,
            clock,
            Options.Create(new RoiCostEvidenceFreshnessOptions { StaleAfterDays = 90 }));
    }

    private sealed class FakeTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }
}
