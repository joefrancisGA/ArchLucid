using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Host.Composition.Compliance;

using FluentAssertions;

using Moq;
namespace ArchLucid.Host.Composition.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCompositionPackageCoverageBatch3Tests
{
    [Fact]
    public void ComplianceRulePackProviderDecisioningPortAdapter_rejects_null_inner()
    {
        Action act = () => _ = new ComplianceRulePackProviderDecisioningPortAdapter(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public async Task ComplianceRulePackProviderDecisioningPortAdapter_forwards_get_rule_pack()
    {
        ArchLucid.Contracts.Compliance.ComplianceRulePack expected = new()
        {
            RulePackId = "pack-1",
            Name = "Baseline",
            Version = "1.0.0",
            RulePackHash = "hash",
            SourcePath = "rules.json",
        };
        Mock<ArchLucid.Core.Persistence.Ports.IComplianceRulePackProvider> inner = new();
        inner.Setup(i => i.GetRulePackAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(expected);
        ComplianceRulePackProviderDecisioningPortAdapter sut = new(inner.Object);

        ComplianceRulePack result = await sut.GetRulePackAsync(CancellationToken.None);

        result.RulePackId.Should().Be("pack-1");
        inner.Verify(i => i.GetRulePackAsync(It.IsAny<CancellationToken>()), Times.Once);
    }
}
