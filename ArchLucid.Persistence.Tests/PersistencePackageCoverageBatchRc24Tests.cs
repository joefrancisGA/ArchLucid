using ArchLucid.Contracts.Compliance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Coordination.Compliance;

using FluentAssertions;

using Moq;

namespace ArchLucid.Persistence.Tests;

/// <summary>RC24 coverage uplift: policy-filtered compliance pack provider orchestration.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PersistencePackageCoverageBatchRc24Tests
{
    [Fact]
    public async Task PolicyFilteredComplianceRulePackProvider_filters_to_effective_compliance_rule_keys()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
        Guid workspaceId = Guid.Parse("11111111-2222-3333-4444-555555555555");
        Guid projectId = Guid.Parse("66666666-7777-8888-9999-aaaaaaaaaaaa");
        ComplianceRulePack fullPack = new()
        {
            RulePackId = "pack-rc24",
            Name = "RC24 Pack",
            Version = "1",
            RulePackHash = "hash",
            SourcePath = "pack.json",
            Rules =
            [
                CreateRule("keep-me"),
                CreateRule("drop-me"),
            ],
        };
        PolicyPackContentDocument effective = new()
        {
            ComplianceRuleKeys = ["keep-me"],
        };
        Mock<IComplianceRulePackLoader> loader = new();
        loader.Setup(l => l.LoadAsync(It.IsAny<CancellationToken>())).ReturnsAsync(fullPack);
        Mock<IEffectiveGovernanceLoader> governance = new();
        governance
            .Setup(g => g.LoadEffectiveContentAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(effective);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(s => s.GetCurrentScope())
            .Returns(new ScopeContext
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
            });
        PolicyFilteredComplianceRulePackProvider sut = new(
            loader.Object,
            governance.Object,
            scopeProvider.Object);

        ComplianceRulePack filtered = await sut.GetRulePackAsync(CancellationToken.None);

        filtered.Rules.Should().ContainSingle(r => r.RuleId == "keep-me");
        filtered.Rules.Should().NotContain(r => r.RuleId == "drop-me");
        filtered.RulePackId.Should().Be("pack-rc24");
        loader.Verify(l => l.LoadAsync(It.IsAny<CancellationToken>()), Times.Once);
        governance.Verify(
            g => g.LoadEffectiveContentAsync(tenantId, workspaceId, projectId, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task PolicyFilteredComplianceRulePackProvider_returns_full_pack_when_no_compliance_keys()
    {
        ComplianceRulePack fullPack = new()
        {
            RulePackId = "pack-open",
            Name = "Open",
            Version = "1",
            RulePackHash = "hash",
            SourcePath = "pack.json",
            Rules = [CreateRule("alpha"), CreateRule("beta")],
        };
        Mock<IComplianceRulePackLoader> loader = new();
        loader.Setup(l => l.LoadAsync(It.IsAny<CancellationToken>())).ReturnsAsync(fullPack);
        Mock<IEffectiveGovernanceLoader> governance = new();
        governance
            .Setup(g => g.LoadEffectiveContentAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new PolicyPackContentDocument());
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(new ScopeContext());
        PolicyFilteredComplianceRulePackProvider sut = new(
            loader.Object,
            governance.Object,
            scopeProvider.Object);

        ComplianceRulePack filtered = await sut.GetRulePackAsync(CancellationToken.None);

        filtered.Rules.Select(r => r.RuleId).Should().BeEquivalentTo("alpha", "beta");
    }

    private static ComplianceRule CreateRule(string ruleId) =>
        new()
        {
            RuleId = ruleId,
            ControlId = "c",
            ControlName = "Control",
            AppliesToCategory = "cat",
            RequiredNodeType = "Service",
            RequiredEdgeType = "DependsOn",
            Description = "d",
            Priority = "P0",
        };
}
