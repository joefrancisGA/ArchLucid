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

    [Fact]
    public void ShouldEmitFinding_production_real_undefined_quality_gate_numeric_string_emits_rule()
    {
        IConfiguration configuration = BuildConfig("Real", "99");

        QualityGateWarnOnlyProductionLikeConfigurationLint.ShouldEmitFinding(
                configuration,
                Environments.Production)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void ShouldEmitFinding_production_real_string_encoded_whole_number_warn_only_emits_rule()
    {
        IConfiguration configuration = BuildConfig("Real", "0.0");

        QualityGateWarnOnlyProductionLikeConfigurationLint.ShouldEmitFinding(
                configuration,
                Environments.Production)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void ShouldEmitFinding_production_real_string_encoded_boolean_warn_only_ignores_synonym()
    {
        IConfiguration configuration = BuildConfig("Real", "False");

        QualityGateWarnOnlyProductionLikeConfigurationLint.ShouldEmitFinding(
                configuration,
                Environments.Production)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void ShouldEmitFinding_production_real_off_synonym_ignores_boolean_synonym()
    {
        IConfiguration configuration = BuildConfig("Real", "off");

        QualityGateWarnOnlyProductionLikeConfigurationLint.ShouldEmitFinding(
                configuration,
                Environments.Production)
            .Should()
            .BeFalse();
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
