using ArchLucid.Core.Hosting;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Core.Tests.Hosting;

/// <summary>TB-2321: production-like hosting must not silently ship with the scorecard gate off.</summary>
[Trait("Category", "Unit")]
public sealed class FinalizeQualityGateProductionLikeConfigurationLintTests
{
    [Fact]
    public void TryDescribeBlockingFinding_returns_null_for_development()
    {
        IConfiguration cfg = new ConfigurationBuilder().AddInMemoryCollection().Build();

        FinalizeQualityGateProductionLikeConfigurationLint
            .TryDescribeBlockingFinding(cfg, Environments.Development)
            .Should().BeNull();
    }

    [Fact]
    public void TryDescribeBlockingFinding_flags_production_when_gate_is_off()
    {
        IConfiguration cfg = new ConfigurationBuilder().AddInMemoryCollection().Build();

        HostingMisconfigurationWarning? warning = FinalizeQualityGateProductionLikeConfigurationLint
            .TryDescribeBlockingFinding(cfg, Environments.Production);

        warning.Should().NotBeNull();
        warning!.Value.RuleName.Should().Be(
            ProductionLikeHostingMisconfigurationAdvisorRuleNames.FinalizeQualityGateDisabledProductionLike);
        warning.Value.Message.Should().Contain("ArchLucid:FinalizeQualityGate:Enabled");
    }

    [Fact]
    public void TryDescribeBlockingFinding_returns_null_for_production_when_gate_is_on()
    {
        Dictionary<string, string?> pairs = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ArchLucid:FinalizeQualityGate:Enabled"] = "true",
        };
        IConfiguration cfg = new ConfigurationBuilder().AddInMemoryCollection(pairs!).Build();

        FinalizeQualityGateProductionLikeConfigurationLint
            .TryDescribeBlockingFinding(cfg, Environments.Production)
            .Should().BeNull();
    }

    [Fact]
    public void Evaluate_surfaces_the_finding_in_blocking_list_for_production()
    {
        IConfiguration cfg = new ConfigurationBuilder().AddInMemoryCollection().Build();

        OperatorConfigurationLintSnapshot snapshot =
            OperatorConfigurationLintEvaluator.Evaluate(cfg, Environments.Production);

        snapshot.BlockingFindings.Should().Contain(warning =>
            string.Equals(
                warning.RuleName,
                ProductionLikeHostingMisconfigurationAdvisorRuleNames.FinalizeQualityGateDisabledProductionLike,
                StringComparison.Ordinal));
    }

    [Fact]
    public void TryDescribeBlockingFinding_rejects_null_configuration_and_blank_environment()
    {
        IConfiguration cfg = new ConfigurationBuilder().AddInMemoryCollection().Build();
        Action nullConfiguration = () => FinalizeQualityGateProductionLikeConfigurationLint.TryDescribeBlockingFinding(null!, "Production");
        Action blankEnvironment = () => FinalizeQualityGateProductionLikeConfigurationLint.TryDescribeBlockingFinding(cfg, " ");

        nullConfiguration.Should().Throw<ArgumentNullException>();
        blankEnvironment.Should().Throw<ArgumentException>();
    }
}
