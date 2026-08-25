using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Core.Governance.Resolution;
using ArchLucid.Core.Manifest;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.TestSupport;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CommittedEffectiveGovernanceSnapshotCapturerTests
{
    [SkippableFact]
    public async Task ApplyToManifestAsync_persists_descriptor_with_assignments_and_compliance_keys()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid packId = Guid.NewGuid();

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        EffectiveGovernanceResolutionResult resolution = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            EffectiveContent = new PolicyPackContentDocument
            {
                ComplianceRuleKeys = ["sec-base-010", "net-base-001"]
            },
            Conflicts = [new GovernanceConflictRecord()]
        };

        Mock<IEffectiveGovernanceResolver> resolver = new();
        resolver
            .Setup(r => r.ResolveAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(resolution);

        PolicyPackAssignment assignment = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            PolicyPackId = packId,
            PolicyPackVersion = "1.2.0",
            ScopeLevel = GovernanceScopeLevel.Project,
            IsEnabled = true
        };

        Mock<IPolicyPackAssignmentRepository> assignments = new();
        assignments
            .Setup(r => r.ListByScopeAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([assignment]);

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdsAsync(It.IsAny<IReadOnlyCollection<Guid>>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([new PolicyPack { PolicyPackId = packId, Name = "Enterprise Baseline", TenantId = tenantId }]);

        Mock<IPolicyPackVersionRepository> versions = new();
        versions
            .Setup(v => v.GetByPackAndVersionAsync(packId, "1.2.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackVersion
            {
                PolicyPackId = packId,
                Version = "1.2.0",
                ContentJson = """{"complianceRuleKeys":["sec-base-010","net-base-001"]}""",
            });

        CommittedEffectiveGovernanceSnapshotCapturer sut = new(
            scopeProvider.Object,
            resolver.Object,
            assignments.Object,
            packs.Object,
            versions.Object);

        ManifestDocument manifest = new()
        {
            RuleSetId = "enterprise-baseline",
            RuleSetVersion = "1.2.0",
            RuleSetHash = "hash-abc"
        };

        await sut.ApplyToManifestAsync(manifest, CancellationToken.None);

        manifest.EffectiveGovernanceAtCommit.Should().NotBeNull();
        manifest.EffectiveGovernanceAtCommit!.RuleSetId.Should().Be("enterprise-baseline");
        manifest.EffectiveGovernanceAtCommit.RuleSetHash.Should().Be("hash-abc");
        manifest.EffectiveGovernanceAtCommit.ComplianceRuleKeyCount.Should().Be(2);
        manifest.EffectiveGovernanceAtCommit.ComplianceRuleKeys.Should().BeEquivalentTo(["net-base-001", "sec-base-010"]);
        manifest.EffectiveGovernanceAtCommit.ConflictCount.Should().Be(1);
        manifest.EffectiveGovernanceAtCommit.HasEffectivePolicy.Should().BeTrue();
        CommittedGovernancePackAssignmentSnapshot assignmentRow =
            manifest.EffectiveGovernanceAtCommit!.PackAssignments.Should().ContainSingle(row =>
                row.PolicyPackId == packId &&
                row.PolicyPackVersion == "1.2.0" &&
                row.ScopeLevel == GovernanceScopeLevel.Project).Subject;

        assignmentRow.ComplianceRuleKeys.Should().BeEquivalentTo(["net-base-001", "sec-base-010"]);
    }

    [SkippableFact]
    public async Task ApplyToManifestAsync_marks_empty_policy_when_no_assignments_or_keys()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

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
            .ReturnsAsync(Array.Empty<PolicyPackAssignment>());

        CommittedEffectiveGovernanceSnapshotCapturer sut = new(
            scopeProvider.Object,
            resolver.Object,
            assignments.Object,
            Mock.Of<IPolicyPackRepository>(),
            Mock.Of<IPolicyPackVersionRepository>());

        ManifestDocument manifest = new()
        {
            RuleSetId = "none",
            RuleSetVersion = "0",
            RuleSetHash = "empty"
        };

        await sut.ApplyToManifestAsync(manifest, CancellationToken.None);

        manifest.EffectiveGovernanceAtCommit.Should().NotBeNull();
        manifest.EffectiveGovernanceAtCommit!.HasEffectivePolicy.Should().BeFalse();
        manifest.EffectiveGovernanceAtCommit.PackAssignments.Should().BeEmpty();
        manifest.EffectiveGovernanceAtCommit.ComplianceRuleKeyCount.Should().Be(0);
    }
}
