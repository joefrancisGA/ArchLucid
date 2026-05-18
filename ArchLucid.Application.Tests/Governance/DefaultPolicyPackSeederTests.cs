using ArchLucid.Application.Governance.DefaultPolicyPacks;
using ArchLucid.Core.Transactions;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Persistence.Governance;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class DefaultPolicyPackSeederTests
{
    [Fact]
    public async Task EnsureDefaultPolicyPacksAsync_creates_all_bundled_platform_packs_when_empty()
    {
        InMemoryPolicyPackRepository packs = new();
        InMemoryPolicyPackVersionRepository versions = new();
        InMemoryPolicyPackAssignmentRepository assignments = new();
        InMemoryPolicyPackChangeLogRepository changeLog = new();
        IArchLucidUnitOfWorkFactory uowFactory = ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory();
        PolicyPackManagementService management = new(
            packs,
            versions,
            assignments,
            changeLog,
            uowFactory,
            NullLogger<PolicyPackManagementService>.Instance);

        DefaultPolicyPackSeeder sut = new(management, packs, NullLogger<DefaultPolicyPackSeeder>.Instance);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        int expectedCount = DefaultPolicyPackBundledManifest.LoadBundles().Count;

        await sut.EnsureDefaultPolicyPacksAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        IReadOnlyList<PolicyPack> scopePacks = await packs.ListByScopeAsync(tenantId, workspaceId, projectId, CancellationToken.None);
        scopePacks.Should().HaveCount(expectedCount);
        scopePacks.Should().OnlyContain(p => p.PackType == PolicyPackType.PlatformDefault);
        scopePacks.Should().Contain(p => p.Name == DefaultPolicyPackCatalog.AiGovernanceDisplayName);
        scopePacks.Should().Contain(p => p.Name == DefaultPolicyPackCatalog.SecurityBaselineDisplayName);
        scopePacks.Should().Contain(p => p.Name == DefaultPolicyPackCatalog.AzureWellArchitectedDisplayName);
        scopePacks.Should().Contain(p => p.Name == DefaultPolicyPackCatalog.AzureCafLandingZoneDisplayName);

        IReadOnlyList<PolicyPackAssignment> assigns =
            await assignments.ListByScopeAsync(tenantId, workspaceId, projectId, CancellationToken.None);
        assigns.Should().HaveCount(expectedCount);
    }

    [Fact]
    public async Task EnsureDefaultPolicyPacksAsync_is_idempotent()
    {
        InMemoryPolicyPackRepository packs = new();
        InMemoryPolicyPackVersionRepository versions = new();
        InMemoryPolicyPackAssignmentRepository assignments = new();
        InMemoryPolicyPackChangeLogRepository changeLog = new();
        IArchLucidUnitOfWorkFactory uowFactory = ArchLucidUnitOfWorkTestDoubles.InMemoryModeFactory();
        PolicyPackManagementService management = new(
            packs,
            versions,
            assignments,
            changeLog,
            uowFactory,
            NullLogger<PolicyPackManagementService>.Instance);

        DefaultPolicyPackSeeder sut = new(management, packs, NullLogger<DefaultPolicyPackSeeder>.Instance);

        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        int expectedCount = DefaultPolicyPackBundledManifest.LoadBundles().Count;

        await sut.EnsureDefaultPolicyPacksAsync(tenantId, workspaceId, projectId, CancellationToken.None);
        await sut.EnsureDefaultPolicyPacksAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        IReadOnlyList<PolicyPack> scopePacks = await packs.ListByScopeAsync(tenantId, workspaceId, projectId, CancellationToken.None);
        scopePacks.Should().HaveCount(expectedCount);
    }
}
