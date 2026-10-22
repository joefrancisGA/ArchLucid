using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Services;

using FluentAssertions;

using Moq;

namespace ArchLucid.Host.Core.Tests.Services;

[Trait("Category", "Unit")]
public sealed class PolicyPackCatalogAdminServiceTests
{
    [Fact]
    public async Task TryPromoteFromSourcePackAsync_blocks_organization_private_pack()
    {
        Guid packId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid tenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid workspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Guid projectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");

        Mock<IPolicyPackRepository> packRepo = new();
        packRepo
            .Setup(r => r.GetByIdAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPack
                {
                    PolicyPackId = packId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    Name = "Org pack",
                    Description = "d",
                    PackType = PolicyPackType.ProjectCustom,
                    DistributionScope = PolicyPackDistributionScope.OrganizationPrivate,
                    CurrentVersion = "1.0.0",
                });

        Mock<IPolicyPackVersionRepository> versionRepo = new();
        versionRepo
            .Setup(r => r.GetByPackAndVersionAsync(packId, "1.0.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPackVersion
                {
                    PolicyPackId = packId,
                    Version = "1.0.0",
                    ContentJson = "{}",
                });

        PolicyPackCatalogAdminService sut = new(
            packRepo.Object,
            versionRepo.Object,
            new Mock<IPolicyPackCatalogRepository>().Object);

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
        };

        Func<Task> act = () => sut.TryPromoteFromSourcePackAsync(scope, packId, null, CancellationToken.None);

        await act.Should().ThrowAsync<PolicyPackCrossTenantDistributionBlockedException>();
    }

    [Fact]
    public async Task TryPromoteFromSourcePackAsync_rejects_display_name_longer_than_catalog_column()
    {
        Guid packId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid tenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid workspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Guid projectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string overlongName = new('n', PolicyPackCatalogEntryLimits.DisplayNameMaxLength + 1);

        Mock<IPolicyPackRepository> packRepo = new();
        packRepo
            .Setup(r => r.GetByIdAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPack
                {
                    PolicyPackId = packId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    Name = overlongName,
                    Description = "d",
                    PackType = PolicyPackType.BuiltIn,
                    DistributionScope = PolicyPackDistributionScope.Platform,
                    CurrentVersion = "1.0.0",
                });

        Mock<IPolicyPackVersionRepository> versionRepo = new();
        versionRepo
            .Setup(r => r.GetByPackAndVersionAsync(packId, "1.0.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPackVersion
                {
                    PolicyPackId = packId,
                    Version = "1.0.0",
                    ContentJson = "{}",
                });

        PolicyPackCatalogAdminService sut = new(
            packRepo.Object,
            versionRepo.Object,
            new Mock<IPolicyPackCatalogRepository>().Object);

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
        };

        Func<Task> act = () => sut.TryPromoteFromSourcePackAsync(scope, packId, null, CancellationToken.None);

        await act.Should()
            .ThrowAsync<ArgumentException>()
            .WithParameterName("displayName")
            .WithMessage($"*at most {PolicyPackCatalogEntryLimits.DisplayNameMaxLength} characters*");
    }

    [Fact]
    public async Task TryPromoteFromSourcePackAsync_rejects_description_longer_than_catalog_column()
    {
        Guid packId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        Guid tenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        Guid workspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        Guid projectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd");
        string overlongDescription = new('d', PolicyPackCatalogEntryLimits.DescriptionMaxLength + 1);

        Mock<IPolicyPackRepository> packRepo = new();
        packRepo
            .Setup(r => r.GetByIdAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPack
                {
                    PolicyPackId = packId,
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    Name = "Built-in pack",
                    Description = overlongDescription,
                    PackType = PolicyPackType.BuiltIn,
                    DistributionScope = PolicyPackDistributionScope.Platform,
                    CurrentVersion = "1.0.0",
                });

        Mock<IPolicyPackVersionRepository> versionRepo = new();
        versionRepo
            .Setup(r => r.GetByPackAndVersionAsync(packId, "1.0.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPackVersion
                {
                    PolicyPackId = packId,
                    Version = "1.0.0",
                    ContentJson = "{}",
                });

        PolicyPackCatalogAdminService sut = new(
            packRepo.Object,
            versionRepo.Object,
            new Mock<IPolicyPackCatalogRepository>().Object);

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
        };

        Func<Task> act = () => sut.TryPromoteFromSourcePackAsync(scope, packId, null, CancellationToken.None);

        await act.Should()
            .ThrowAsync<ArgumentException>()
            .WithParameterName("description")
            .WithMessage($"*at most {PolicyPackCatalogEntryLimits.DescriptionMaxLength} characters*");
    }
}
