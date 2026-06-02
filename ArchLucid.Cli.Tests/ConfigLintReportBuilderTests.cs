using ArchLucid.Cli.Commands;

using ArchLucid.Core.Hosting;

using FluentAssertions;

using Microsoft.Extensions.Hosting;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ConfigLintReportBuilderTests
{
    [Theory]
    [InlineData(0, 0, "READY")]
    [InlineData(0, 2, "WARN")]
    [InlineData(1, 0, "HOLD")]
    [InlineData(2, 3, "HOLD")]
    public void ResolveDisposition_MapsBlockingAndAdvisoryCounts(
        int blockingCount,
        int advisoryCount,
        string expected)
    {
        ConfigLintReportBuilder.ResolveDisposition(blockingCount, advisoryCount).Should().Be(expected);
    }

    [Fact]
    public void Build_withoutProfile_keeps_quality_gate_warn_only_advisory()
    {
        HostingMisconfigurationWarning warning = new(
            ProductionLikeHostingMisconfigurationAdvisorRuleNames.QualityGateWarnOnlyInRealProductionLike,
            "Real + WarnOnly on production-like hosting.");

        OperatorConfigurationLintSnapshot snapshot = new(
            Environments.Production,
            [],
            [warning]);

        ConfigLintReportDocument document = ConfigLintReportBuilder.Build(snapshot, profileName: null);

        document.Disposition.Should().Be("WARN");
        document.BlockingFindings.Should().BeEmpty();
        document.AdvisoryFindings.Should().ContainSingle(static f =>
            f.RuleName
            == ProductionLikeHostingMisconfigurationAdvisorRuleNames.QualityGateWarnOnlyInRealProductionLike);
    }

    [Fact]
    public void Build_productionLikeHostedPilotProfile_promotes_quality_gate_warn_only_to_blocking()
    {
        HostingMisconfigurationWarning warning = new(
            ProductionLikeHostingMisconfigurationAdvisorRuleNames.QualityGateWarnOnlyInRealProductionLike,
            "Real + WarnOnly on production-like hosting.");

        OperatorConfigurationLintSnapshot snapshot = new(
            Environments.Production,
            [],
            [warning]);

        ConfigLintReportDocument document = ConfigLintReportBuilder.Build(
            snapshot,
            ConfigLintProfileNames.ProductionLikeHostedPilot);

        document.Disposition.Should().Be("HOLD");
        document.Ok.Should().BeFalse();
        document.BlockingFindings.Should().ContainSingle(static f =>
            f.RuleName
            == ProductionLikeHostingMisconfigurationAdvisorRuleNames.QualityGateWarnOnlyInRealProductionLike);
        document.AdvisoryFindings.Should().BeEmpty();
    }
}
