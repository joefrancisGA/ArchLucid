using ArchLucid.Core.Hosting;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Core.Tests.Hosting;
[Trait("Category", "Unit")]

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

    [Fact]
    public void Evaluate_RealMode_InvalidAzureOpenAiEndpointUrl_AddsInvalidUrlAdvisory()
    {
        Dictionary<string, string?> pairs = new(StringComparer.OrdinalIgnoreCase)
        {
            ["AgentExecution:Mode"] = "Real",
            ["AzureOpenAI:Endpoint"] = "not-a-uri",
        };

        IConfiguration cfg = new ConfigurationBuilder().AddInMemoryCollection(pairs!).Build();

        OperatorConfigurationLintSnapshot snapshot =
            OperatorConfigurationLintEvaluator.Evaluate(
                cfg,
                Environments.Development,
                (_, _) => throw new InvalidOperationException("probe should not run when URL is invalid"));

        snapshot.AdvisoryFindings.Should().Contain(w =>
            string.Equals(w.RuleName, AzureOpenAiEndpointConnectivityLintAdvisor.InvalidUrlRuleName, StringComparison.Ordinal));
    }

    [Fact]
    public void Evaluate_RealMode_UnreachableProbe_AddsUnreachableAdvisory()
    {
        Dictionary<string, string?> pairs = new(StringComparer.OrdinalIgnoreCase)
        {
            ["AgentExecution:Mode"] = "Real",
            ["AzureOpenAI:Endpoint"] = "https://unit-test.openai.azure.com/",
        };

        IConfiguration cfg = new ConfigurationBuilder().AddInMemoryCollection(pairs!).Build();

        OperatorConfigurationLintSnapshot snapshot =
            OperatorConfigurationLintEvaluator.Evaluate(
                cfg,
                Environments.Development,
                (_, _) => Task.FromResult(false));

        snapshot.AdvisoryFindings.Should().Contain(w =>
            string.Equals(w.RuleName, AzureOpenAiEndpointConnectivityLintAdvisor.UnreachableRuleName, StringComparison.Ordinal));
    }

    [Fact]
    public void Evaluate_RealMode_ReachableProbe_AddsNoConnectivityAdvisory()
    {
        Dictionary<string, string?> pairs = new(StringComparer.OrdinalIgnoreCase)
        {
            ["AgentExecution:Mode"] = "Real",
            ["AzureOpenAI:Endpoint"] = "https://unit-test.openai.azure.com/",
        };

        IConfiguration cfg = new ConfigurationBuilder().AddInMemoryCollection(pairs!).Build();

        OperatorConfigurationLintSnapshot snapshot =
            OperatorConfigurationLintEvaluator.Evaluate(
                cfg,
                Environments.Development,
                (_, _) => Task.FromResult(true));

        snapshot.AdvisoryFindings.Should().NotContain(w =>
            AzureOpenAiEndpointConnectivityLintAdvisor.IsConnectivitySurfaceRule(w.RuleName));
    }

    [Fact]
    public void Evaluate_RealEchoMode_SkipsConnectivityProbeEvenWhenEndpointSet()
    {
        Dictionary<string, string?> pairs = new(StringComparer.OrdinalIgnoreCase)
        {
            ["AgentExecution:Mode"] = "Real",
            ["AgentExecution:CompletionClient"] = "Echo",
            ["AzureOpenAI:Endpoint"] = "https://unit-test.openai.azure.com/",
        };

        IConfiguration cfg = new ConfigurationBuilder().AddInMemoryCollection(pairs!).Build();

        OperatorConfigurationLintSnapshot snapshot =
            OperatorConfigurationLintEvaluator.Evaluate(
                cfg,
                Environments.Development,
                (_, _) => throw new InvalidOperationException("probe must not run for Echo"));

        snapshot.AdvisoryFindings.Should().NotContain(w =>
            AzureOpenAiEndpointConnectivityLintAdvisor.IsConnectivitySurfaceRule(w.RuleName));
    }
}
