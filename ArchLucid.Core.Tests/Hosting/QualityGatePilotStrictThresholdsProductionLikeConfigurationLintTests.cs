using ArchLucid.Core.Configuration;
using ArchLucid.Core.Hosting;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Core.Tests.Hosting;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class QualityGatePilotStrictThresholdsProductionLikeConfigurationLintTests
{
    [Fact]
    public void TryDescribeAdvisoryFinding_development_pilot_strict_loose_returns_null()
    {
        IConfiguration configuration = BuildCompliantPilotStrictConfig();

        QualityGatePilotStrictThresholdsProductionLikeConfigurationLint.TryDescribeAdvisoryFinding(
                configuration,
                Environments.Development)
            .Should()
            .BeNull();
    }

    [Fact]
    public void TryDescribeAdvisoryFinding_production_compliant_pilot_strict_returns_null()
    {
        IConfiguration configuration = BuildCompliantPilotStrictConfig();

        QualityGatePilotStrictThresholdsProductionLikeConfigurationLint.TryDescribeAdvisoryFinding(
                configuration,
                Environments.Production)
            .Should()
            .BeNull();
    }

    [Fact]
    public void TryDescribeAdvisoryFinding_production_loose_semantic_reject_emits_rule()
    {
        IConfiguration configuration = BuildCompliantPilotStrictConfig(
            semanticRejectBelow: "0.5");

        HostingMisconfigurationWarning? finding =
            QualityGatePilotStrictThresholdsProductionLikeConfigurationLint.TryDescribeAdvisoryFinding(
                configuration,
                Environments.Production);

        finding.Should().NotBeNull();
        finding!.Value.RuleName.Should()
            .Be(ProductionLikeHostingMisconfigurationAdvisorRuleNames
                .QualityGatePilotStrictThresholdsTooLooseInProductionLike);
    }

    [Fact]
    public void TryDescribeAdvisoryFinding_production_missing_faithfulness_ratio_emits_rule()
    {
        IConfiguration configuration = BuildCompliantPilotStrictConfig(
            faithfulnessRatio: null);

        QualityGatePilotStrictThresholdsProductionLikeConfigurationLint.TryDescribeAdvisoryFinding(
                configuration,
                Environments.Production)
            .Should()
            .NotBeNull();
    }

    [Fact]
    public void TryDescribeAdvisoryFinding_production_enforce_off_emits_rule()
    {
        IConfiguration configuration = BuildCompliantPilotStrictConfig(enforceOnReject: "false");

        QualityGatePilotStrictThresholdsProductionLikeConfigurationLint.TryDescribeAdvisoryFinding(
                configuration,
                Environments.Production)
            .Should()
            .NotBeNull();
    }

    private static IConfiguration BuildCompliantPilotStrictConfig(
        string? semanticRejectBelow = "0.55",
        string? faithfulnessRatio = "0.65",
        string enforceOnReject = "true")
    {
        List<KeyValuePair<string, string?>> pairs =
        [
            new KeyValuePair<string, string?>(
                $"{AgentOutputQualityGateOptions.SectionPath}:Enabled",
                "true"),
            new KeyValuePair<string, string?>(
                $"{AgentOutputQualityGateOptions.SectionPath}:Mode",
                nameof(AgentOutputQualityGateMode.PilotStrict)),
            new KeyValuePair<string, string?>(
                $"{AgentOutputQualityGateOptions.SectionPath}:EnforceOnReject",
                enforceOnReject),
            new KeyValuePair<string, string?>(
                $"{AgentOutputQualityGateOptions.SectionPath}:BlockRunOnReject",
                "true"),
            new KeyValuePair<string, string?>(
                $"{AgentOutputQualityGateOptions.SectionPath}:PilotStrictMinSemanticScore",
                "0.55"),
            new KeyValuePair<string, string?>(
                $"{AgentOutputQualityGateOptions.SectionPath}:PerAgentTypeFloors:Critic:SemanticRejectBelow",
                "0.55"),
        ];

        if (semanticRejectBelow is not null)
        {
            pairs.Add(
                new KeyValuePair<string, string?>(
                    $"{AgentOutputQualityGateOptions.SectionPath}:SemanticRejectBelow",
                    semanticRejectBelow));
        }

        if (faithfulnessRatio is not null)
        {
            pairs.Add(
                new KeyValuePair<string, string?>(
                    $"{AgentOutputQualityGateOptions.SectionPath}:PilotStrictMinFaithfulnessSupportRatio",
                    faithfulnessRatio));
        }

        return new ConfigurationBuilder().AddInMemoryCollection(pairs).Build();
    }
}
