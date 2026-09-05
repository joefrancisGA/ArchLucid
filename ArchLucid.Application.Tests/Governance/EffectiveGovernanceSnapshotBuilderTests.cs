using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Governance.Resolution;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class EffectiveGovernanceSnapshotBuilderTests
{
    [Fact]
    public async Task ResolveAsync_marks_disabled_assignments_excluded_and_not_assessed_dimensions()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid securityPackId = Guid.NewGuid();
        Guid sustainabilityPackId = Guid.NewGuid();

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId
        };

        PolicyPackAssignment enabledSecurity = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            PolicyPackId = securityPackId,
            PolicyPackVersion = "1.0.0",
            ScopeLevel = GovernanceScopeLevel.Project,
            IsEnabled = true
        };

        PolicyPackAssignment disabledSustainability = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            PolicyPackId = sustainabilityPackId,
            PolicyPackVersion = "1.0.0",
            ScopeLevel = GovernanceScopeLevel.Project,
            IsEnabled = false
        };

        Mock<IEffectiveGovernanceResolver> resolver = new();
        resolver
            .Setup(r => r.ResolveAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new EffectiveGovernanceResolutionResult
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                EffectiveContent = new PolicyPackContentDocument
                {
                    ComplianceRuleKeys = ["sec-base-010"]
                }
            });

        Mock<IPolicyPackAssignmentRepository> assignments = new();
        assignments
            .Setup(r => r.ListByScopeAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([enabledSecurity, disabledSustainability]);

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdsAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new PolicyPack
                {
                    PolicyPackId = securityPackId,
                    Name = "Security Architecture Baseline",
                    TenantId = tenantId,
                    QualityDimension = QualityDimension.Security
                },
                new PolicyPack
                {
                    PolicyPackId = sustainabilityPackId,
                    Name = "Sustainability and Resource Efficiency",
                    TenantId = tenantId,
                    QualityDimension = QualityDimension.SustainabilityAndResourceEfficiency
                }
            ]);

        ArchitectureRequest request = new()
        {
            CloudProvider = CloudProvider.Azure,
            PolicyReferences = []
        };

        EffectiveGovernanceSnapshotBuilder sut = new();
        EffectiveGovernanceSnapshotResolution result = await sut.ResolveAsync(
            scope,
            request,
            resolver.Object,
            assignments.Object,
            packs.Object,
            preloadedScopePolicyPackAssignments: null,
            CancellationToken.None);

        result.PackAssignments.Should().ContainSingle(row => row.PolicyPackId == securityPackId);
        result.CoverageAssignments.Should().Contain(row =>
            row.PolicyPackId == sustainabilityPackId
            && row.SelectionState == CoverageSelectionState.RecommendedButExcluded.ToString()
            && row.ExclusionReason == EffectiveGovernanceSnapshotBuilder.DisabledAssignmentExclusionReason);
        result.NotAssessedQualityDimensions.Should().NotContain(row =>
            row.QualityDimension == QualityDimension.SustainabilityAndResourceEfficiency.ToString());
        result.NotAssessedQualityDimensions.Should().Contain(row =>
            row.QualityDimension == QualityDimension.ReliabilityAndResilience.ToString());
    }

    [Fact]
    public async Task ResolveAsync_focused_pilot_includes_organization_required_pack_in_pack_assignments()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid orgPackId = Guid.NewGuid();

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId
        };

        PolicyPackAssignment orgRequiredPack = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            PolicyPackId = orgPackId,
            PolicyPackVersion = "3.1.0",
            ScopeLevel = GovernanceScopeLevel.Project,
            IsEnabled = true,
            IsOrganizationRequired = true
        };

        Mock<IEffectiveGovernanceResolver> resolver = new();
        resolver
            .Setup(r => r.ResolveAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new EffectiveGovernanceResolutionResult
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId
            });

        Mock<IPolicyPackAssignmentRepository> assignments = new();
        assignments
            .Setup(r => r.ListByScopeAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([orgRequiredPack]);

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdsAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new PolicyPack
                {
                    PolicyPackId = orgPackId,
                    Name = "Enterprise PCI Segmentation Standard",
                    TenantId = tenantId
                }
            ]);

        ArchitectureRequest request = new()
        {
            CloudProvider = CloudProvider.Azure,
            PolicyReferences = [FocusedPilotModePolicyPacks.ReferenceToken]
        };

        EffectiveGovernanceSnapshotBuilder sut = new();
        EffectiveGovernanceSnapshotResolution result = await sut.ResolveAsync(
            scope,
            request,
            resolver.Object,
            assignments.Object,
            packs.Object,
            preloadedScopePolicyPackAssignments: null,
            CancellationToken.None);

        result.PackAssignments.Should().ContainSingle(row =>
            row.PolicyPackId == orgPackId
            && row.PolicyPackVersion == "3.1.0");
        result.CoverageAssignments.Should().Contain(row =>
            row.PolicyPackId == orgPackId
            && row.ExclusionReason == null);
    }
}
