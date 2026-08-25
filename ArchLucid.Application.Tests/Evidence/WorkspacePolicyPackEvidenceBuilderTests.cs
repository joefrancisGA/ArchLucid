using ArchLucid.Application.Evidence;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Governance.Resolution;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Governance.PolicyPacks;
using ArchLucid.Persistence.Data.Repositories;

using ArchLucid.Decisioning.Interfaces;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Evidence;

[Trait("Category", "Unit")]
public sealed class WorkspacePolicyPackEvidenceBuilderTests
{
    [Fact]
    public async Task BuildAsync_appends_workspace_policy_pack_policies()
    {
        Guid packId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(static p => p.GetCurrentScope()).Returns(scope);

        Mock<IEffectiveGovernanceResolver> resolver = new();
        resolver
            .Setup(static r => r.ResolveAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new EffectiveGovernanceResolutionResult
            {
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
            });

        Mock<IPolicyPackAssignmentRepository> assignments = new();
        assignments
            .Setup(static r => r.ListByScopeAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new PolicyPackAssignment
                {
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ProjectId = scope.ProjectId,
                    PolicyPackId = packId,
                    PolicyPackVersion = "1.0.0",
                    IsEnabled = true,
                },
            ]);

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(static r => r.GetByIdsAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new PolicyPack
                {
                    PolicyPackId = packId,
                    TenantId = scope.TenantId,
                    Name = "Enterprise Security",
                },
            ]);

        WorkspacePolicyPackEvidenceBuilder sut = new(
            new DefaultEvidenceBuilder(Mock.Of<IUnifiedGoldenManifestReader>()),
            new EffectiveGovernanceSnapshotBuilder(),
            resolver.Object,
            assignments.Object,
            packs.Object,
            Mock.Of<IPolicyPackVersionRepository>(),
            scopeProvider.Object);

        ArchitectureRequest request = new()
        {
            RequestId = "req-evidence",
            Description = "Enough characters here",
            SystemName = "EvidenceSystem",
        };

        AgentEvidencePackage package = await sut.BuildAsync("run-evidence", request, CancellationToken.None);

        package.Policies.Should().Contain(p => p.PolicyId == packId.ToString("D"));
    }
}
