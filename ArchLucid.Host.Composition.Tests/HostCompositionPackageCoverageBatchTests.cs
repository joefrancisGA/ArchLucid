using ArchLucid.Contracts.Compliance;
using ArchLucid.Core.GoToMarket;
using ArchLucid.Decisioning.Compliance.Models;
using ArchLucid.Host.Composition.Compliance;
using ArchLucid.Host.Composition.GoToMarket;
using ArchLucid.Host.Composition.Orchestration;
using ArchLucid.Host.Composition.Orchestration.Dtf;

using FluentAssertions;

using Moq;

namespace ArchLucid.Host.Composition.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCompositionPackageCoverageBatchTests
{
    [Fact]
    public async Task InMemoryRoiBulletinAggregateReader_returns_insufficient_sample()
    {
        InMemoryRoiBulletinAggregateReader sut = new();
        RoiBulletinQuarterWindow window = new("2026-Q1", DateTimeOffset.UtcNow, DateTimeOffset.UtcNow.AddMonths(3));

        RoiBulletinAggregateReadResult result = await sut.ReadAsync(window, minimumTenantsRequired: 5, CancellationToken.None);

        result.IsSufficientSample.Should().BeFalse();
        result.TenantCount.Should().Be(0);
        result.QuarterLabel.Should().Be("2026-Q1");
    }

    [Fact]
    public async Task ComplianceRulePackProviderDecisioningPortAdapter_forwards_rule_pack()
    {
        ArchLucid.Contracts.Compliance.ComplianceRulePack contractPack = new()
        {
            RulePackId = "pack-1",
            Name = "Baseline",
            Version = "1.0",
            RulePackHash = "hash",
            SourcePath = "rules.json",
        };
        Mock<ArchLucid.Core.Persistence.Ports.IComplianceRulePackProvider> inner = new();
        inner.Setup(i => i.GetRulePackAsync(It.IsAny<CancellationToken>()))
            .ReturnsAsync(contractPack);

        ComplianceRulePackProviderDecisioningPortAdapter sut = new(inner.Object);

        ArchLucid.Decisioning.Compliance.Models.ComplianceRulePack pack = await sut.GetRulePackAsync(CancellationToken.None);

        pack.RulePackId.Should().Be("pack-1");
        pack.Name.Should().Be("Baseline");
    }

    [Fact]
    public void DtfAuthorityRunOrchestrator_rejects_null_inner()
    {
        Action act = () => _ = new DtfAuthorityRunOrchestrator(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    [Fact]
    public void AuthorityDurableTaskRegistrationStubOrchestrator_can_be_constructed()
    {
        AuthorityDurableTaskRegistrationStubOrchestrator sut = new();

        sut.Should().NotBeNull();
    }
}
