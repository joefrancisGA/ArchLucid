using ArchLucid.Core.Hosting;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Core.Tests.Hosting;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class QualityGateWarnOnlyProductionLikeConfigurationLintTests
{
    [Fact]
    public void TryDescribeAdvisoryFinding_development_real_warn_only_returns_null()
    {
        IConfiguration configuration = BuildConfig("Real", "WarnOnly");

        QualityGateWarnOnlyProductionLikeConfigurationLint.TryDescribeAdvisoryFinding(
                configuration,
                Environments.Development)
            .Should()
            .BeNull();
    }

    [Fact]
    public void TryDescribeAdvisoryFinding_production_simulator_warn_only_returns_null()
    {
        IConfiguration configuration = BuildConfig("Simulator", "WarnOnly");

        QualityGateWarnOnlyProductionLikeConfigurationLint.TryDescribeAdvisoryFinding(
                configuration,
                Environments.Production)
            .Should()
            .BeNull();
    }

    [Fact]
    public void TryDescribeAdvisoryFinding_production_real_pilot_strict_returns_null()
    {
        IConfiguration configuration = BuildConfig("Real", "PilotStrict");

        QualityGateWarnOnlyProductionLikeConfigurationLint.TryDescribeAdvisoryFinding(
                configuration,
                Environments.Production)
            .Should()
            .BeNull();
    }

    [Fact]
    public void TryDescribeAdvisoryFinding_production_real_warn_only_emits_rule()
    {
        IConfiguration configuration = BuildConfig("Real", "WarnOnly");

        HostingMisconfigurationWarning? finding =
            QualityGateWarnOnlyProductionLikeConfigurationLint.TryDescribeAdvisoryFinding(
                configuration,
                Environments.Production);

        finding.Should().NotBeNull();
        finding!.Value.RuleName.Should()
            .Be(ProductionLikeHostingMisconfigurationAdvisorRuleNames.QualityGateWarnOnlyInRealProductionLike);
    }

    private static IConfiguration BuildConfig(string agentExecutionMode, string? qualityGateMode)
    {
        List<KeyValuePair<string, string?>> pairs =
        [
            new KeyValuePair<string, string?>("AgentExecution:Mode", agentExecutionMode),
        ];

        if (qualityGateMode is not null)
        {
            pairs.Add(
                new KeyValuePair<string, string?>(
                    QualityGateWarnOnlyProductionLikeConfigurationLint.QualityGateModeKey,
                    qualityGateMode));
        }

        return new ConfigurationBuilder().AddInMemoryCollection(pairs).Build();
    }
}
