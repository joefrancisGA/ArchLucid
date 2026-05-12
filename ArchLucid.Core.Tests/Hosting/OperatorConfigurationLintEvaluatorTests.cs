using ArchLucid.Core.Hosting;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Core.Tests.Hosting;

public sealed class OperatorConfigurationLintEvaluatorTests
{
    [Fact]
    public void Evaluate_DevelopmentWithUnsetAuthMode_HasNoBlockingFindings()
    {
        IConfiguration cfg = new ConfigurationBuilder().AddInMemoryCollection().Build();

        OperatorConfigurationLintSnapshot snapshot =
            OperatorConfigurationLintEvaluator.Evaluate(cfg, Environments.Development);

        snapshot.Ok.Should().BeTrue();
        snapshot.BlockingFindings.Should().BeEmpty();
    }

    [Fact]
    public void Evaluate_SimulatedProduction_WithDevelopmentBypass_HasBlockingFinding()
    {
        Dictionary<string, string?> pairs = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
        };

        IConfiguration cfg = new ConfigurationBuilder().AddInMemoryCollection(pairs!).Build();

        OperatorConfigurationLintSnapshot snapshot =
            OperatorConfigurationLintEvaluator.Evaluate(cfg, Environments.Production);

        snapshot.Ok.Should().BeFalse();
        snapshot.BlockingFindings.Should().NotBeEmpty();
        snapshot.BlockingFindings.Should().Contain(w =>
            string.Equals(w.RuleName, ProductionLikeHostingMisconfigurationAdvisorRuleNames.AuthModeDevelopmentBypassDisallowed,
                StringComparison.Ordinal));
    }
}
