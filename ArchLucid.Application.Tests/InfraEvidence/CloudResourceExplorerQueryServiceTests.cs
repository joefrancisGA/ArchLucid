using ArchLucid.Application.InfraEvidence;
using ArchLucid.Contracts.InfraEvidence;
using ArchLucid.Core.Pagination;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class CloudResourceExplorerQueryServiceTests
{
    [Fact]
    public async Task ListCloudResourcesAsync_maps_work_counts_onto_summary()
    {
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };
        Guid cloudResourceId = Guid.NewGuid();
        DateTime lastSeenUtc = new(2026, 9, 1, 12, 0, 0, DateTimeKind.Utc);

        Mock<ICloudResourceIdentityDirectory> identityDirectory = new();
        identityDirectory
            .Setup(directory => directory.ListForExplorerAsync(
                scope,
                null,
                null,
                null,
                CloudResourceExplorerWorkQueue.All,
                1,
                50,
                It.IsAny<CancellationToken>()))
            .ReturnsAsync((
                new List<CloudResourceExplorerListItem>
                {
                    new()
                    {
                        Identity = new CloudResourceIdentityRecord
                        {
                            CloudResourceId = cloudResourceId,
                            TenantId = scope.TenantId,
                            ExternalResourceIdNormalized = "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/gateway",
                            DisplayName = "gateway-pip",
                            LastSeenUtc = lastSeenUtc,
                        },
                        WorkCounts = new CloudResourceExplorerWorkCounts
                        {
                            OpenOperationalFindingsCount = 2,
                            OpenRemediationInstancesCount = 1,
                            InventoryDriftChangeCount = 4,
                        },
                    },
                },
                1));

        CloudResourceExplorerQueryService service = new(identityDirectory.Object);

        PagedResponse<CloudResourceSummary> response = await service.ListCloudResourcesAsync(
            scope,
            null,
            null,
            null,
            CloudResourceExplorerWorkQueue.All,
            1,
            50,
            CancellationToken.None);

        response.Items.Should().ContainSingle();
        CloudResourceSummary summary = response.Items.Single();
        summary.CloudResourceId.Should().Be(cloudResourceId);
        summary.WorkCounts.Should().NotBeNull();
        summary.WorkCounts!.OpenOperationalFindingsCount.Should().Be(2);
        summary.WorkCounts.OpenRemediationInstancesCount.Should().Be(1);
        summary.WorkCounts.InventoryDriftChangeCount.Should().Be(4);
    }
}
