using ArchLucid.Decisioning.Governance.PolicyPacks;

using FluentAssertions;

using Moq;

namespace ArchLucid.Decisioning.Tests;

/// <summary>
/// <see cref="PolicyPackResolver"/> lists hierarchical assignments (repository applies scope), keeps enabled rows only,
/// and expands pack + version rows — skipping orphans without throwing.
/// </summary>
[Trait("Category", "Unit")]
public sealed class PolicyPackResolverTests
{
    [Fact]
    public async Task ResolveAsync_EchoesScope_AndReturnsEmptyPacks_WhenNoAssignments()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Mock<IPolicyPackAssignmentRepository> assignments = new();
        assignments
            .Setup(a => a.ListByScopeAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([]);

        Mock<IPolicyPackRepository> packs = new();
        Mock<IPolicyPackVersionRepository> versions = new();

        PolicyPackResolver sut = new(assignments.Object, packs.Object, versions.Object);

        EffectivePolicyPackSet result = await sut.ResolveAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        result.TenantId.Should().Be(tenantId);
        result.WorkspaceId.Should().Be(workspaceId);
        result.ProjectId.Should().Be(projectId);
        result.Packs.Should().BeEmpty();
    }

    [Fact]
    public async Task ResolveAsync_Skips_DisabledAssignments()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid packId = Guid.NewGuid();

        PolicyPackAssignment disabled = new()
        {
            PolicyPackId = packId,
            PolicyPackVersion = "1.0.0",
            IsEnabled = false
        };

        Mock<IPolicyPackAssignmentRepository> assignments = new();
        assignments
            .Setup(a => a.ListByScopeAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([disabled]);

        Mock<IPolicyPackRepository> packs = new();
        Mock<IPolicyPackVersionRepository> versions = new();

        PolicyPackResolver sut = new(assignments.Object, packs.Object, versions.Object);

        EffectivePolicyPackSet result = await sut.ResolveAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        result.Packs.Should().BeEmpty();
        packs.Verify(
            r => r.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ResolveAsync_ReturnsResolvedPack_WhenPackAndVersionExist()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid packId = Guid.NewGuid();
        const string versionLabel = "1.0.0";
        const string contentJson = """{"alertRuleIds":[]}""";

        PolicyPackAssignment assignment = new()
        {
            PolicyPackId = packId,
            PolicyPackVersion = versionLabel,
            IsEnabled = true
        };

        Mock<IPolicyPackAssignmentRepository> assignments = new();
        assignments
            .Setup(a => a.ListByScopeAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([assignment]);

        PolicyPack pack = new()
        {
            PolicyPackId = packId,
            Name = "Security baseline",
            PackType = PolicyPackType.BuiltIn
        };

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(pack);

        PolicyPackVersion version = new()
        {
            PolicyPackId = packId,
            Version = versionLabel,
            ContentJson = contentJson
        };

        Mock<IPolicyPackVersionRepository> versions = new();
        versions
            .Setup(r => r.GetByPackAndVersionAsync(packId, versionLabel, It.IsAny<CancellationToken>()))
            .ReturnsAsync(version);

        PolicyPackResolver sut = new(assignments.Object, packs.Object, versions.Object);

        EffectivePolicyPackSet result = await sut.ResolveAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        ResolvedPolicyPack entry = result.Packs.Should().ContainSingle().Subject;
        entry.PolicyPackId.Should().Be(packId);
        entry.Name.Should().Be("Security baseline");
        entry.Version.Should().Be(versionLabel);
        entry.PackType.Should().Be(PolicyPackType.BuiltIn);
        entry.ContentJson.Should().Be(contentJson);
    }

    [Fact]
    public async Task ResolveAsync_SkipsAssignment_WhenPackRowMissing()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid packId = Guid.NewGuid();

        PolicyPackAssignment assignment = new()
        {
            PolicyPackId = packId,
            PolicyPackVersion = "1.0.0",
            IsEnabled = true
        };

        Mock<IPolicyPackAssignmentRepository> assignments = new();
        assignments
            .Setup(a => a.ListByScopeAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([assignment]);

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyPack?)null);

        Mock<IPolicyPackVersionRepository> versions = new();

        PolicyPackResolver sut = new(assignments.Object, packs.Object, versions.Object);

        EffectivePolicyPackSet result = await sut.ResolveAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        result.Packs.Should().BeEmpty();
        versions.Verify(
            r => r.GetByPackAndVersionAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ResolveAsync_SkipsAssignment_WhenVersionRowMissing()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid packId = Guid.NewGuid();
        const string versionLabel = "9.9.9";

        PolicyPackAssignment assignment = new()
        {
            PolicyPackId = packId,
            PolicyPackVersion = versionLabel,
            IsEnabled = true
        };

        Mock<IPolicyPackAssignmentRepository> assignments = new();
        assignments
            .Setup(a => a.ListByScopeAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync([assignment]);

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(packId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new PolicyPack
                {
                    PolicyPackId = packId,
                    Name = "Orphan assign",
                    PackType = PolicyPackType.ProjectCustom
                });

        Mock<IPolicyPackVersionRepository> versions = new();
        versions
            .Setup(r => r.GetByPackAndVersionAsync(packId, versionLabel, It.IsAny<CancellationToken>()))
            .ReturnsAsync((PolicyPackVersion?)null);

        PolicyPackResolver sut = new(assignments.Object, packs.Object, versions.Object);

        EffectivePolicyPackSet result = await sut.ResolveAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        result.Packs.Should().BeEmpty();
    }

    [Fact]
    public async Task ResolveAsync_PreservesAssignmentListOrder()
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid packA = Guid.NewGuid();
        Guid packB = Guid.NewGuid();

        List<PolicyPackAssignment> rows =
        [
            new()
            {
                PolicyPackId = packA,
                PolicyPackVersion = "1.0.0",
                IsEnabled = true
            },
            new()
            {
                PolicyPackId = packB,
                PolicyPackVersion = "2.0.0",
                IsEnabled = true
            }
        ];

        Mock<IPolicyPackAssignmentRepository> assignments = new();
        assignments
            .Setup(a => a.ListByScopeAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(rows);

        Mock<IPolicyPackRepository> packs = new();
        packs
            .Setup(r => r.GetByIdAsync(packA, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPack { PolicyPackId = packA, Name = "First", PackType = PolicyPackType.BuiltIn });
        packs
            .Setup(r => r.GetByIdAsync(packB, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPack { PolicyPackId = packB, Name = "Second", PackType = PolicyPackType.WorkspaceCustom });

        Mock<IPolicyPackVersionRepository> versions = new();
        versions
            .Setup(r => r.GetByPackAndVersionAsync(packA, "1.0.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackVersion { PolicyPackId = packA, Version = "1.0.0", ContentJson = "{}" });
        versions
            .Setup(r => r.GetByPackAndVersionAsync(packB, "2.0.0", It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackVersion { PolicyPackId = packB, Version = "2.0.0", ContentJson = """{"a":1}""" });

        PolicyPackResolver sut = new(assignments.Object, packs.Object, versions.Object);

        EffectivePolicyPackSet result = await sut.ResolveAsync(tenantId, workspaceId, projectId, CancellationToken.None);

        result.Packs.Should().HaveCount(2);
        result.Packs[0].PolicyPackId.Should().Be(packA);
        result.Packs[1].PolicyPackId.Should().Be(packB);
    }
}
