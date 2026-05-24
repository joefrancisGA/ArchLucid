using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Host.Core.Startup.Validation.Rules;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

using Moq;

namespace ArchLucid.Host.Composition.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RealModeDeploymentFingerprintRulesTests
{
    [Fact]
    public void Collect_when_production_real_simulator_sentinel_adds_error()
    {
        IConfiguration configuration = BuildConfiguration(
            d => d["AzureOpenAI:DeploymentName"] = AgentExecutionTraceModelMetadata.SimulatorDeploymentName);

        List<string> errors = RunCollect(Environments.Production, configuration);

        errors.Should()
            .ContainSingle(static e => e.Contains("sentinel", StringComparison.OrdinalIgnoreCase)
                                       && e.Contains("AzureOpenAI:DeploymentName", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Collect_when_staging_real_unspecified_sentinel_adds_error()
    {
        IConfiguration configuration = BuildConfiguration(
            d => d["AzureOpenAI:DeploymentName"] = AgentExecutionTraceModelMetadata.UnspecifiedDeploymentName);

        List<string> errors = RunCollect(Environments.Staging, configuration);

        errors.Should().ContainSingle(static e => e.Contains("sentinel", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Collect_when_production_real_fallback_prefix_deployment_adds_error()
    {
        IConfiguration configuration = BuildConfiguration(
            d => d["AzureOpenAI:DeploymentName"] =
                     AgentExecutionTraceModelMetadata.LlmCompletionFallbackDeploymentPrefix + "eastus2-secondary");

        List<string> errors = RunCollect(Environments.Production, configuration);

        errors.Should()
            .ContainSingle(static e => e.Contains("fallback:", StringComparison.Ordinal)
                                       && e.Contains("AzureOpenAI:DeploymentName", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void Collect_when_production_real_valid_deployment_is_clean()
    {
        IConfiguration configuration = BuildConfiguration(
            d => d["AzureOpenAI:DeploymentName"] = "gpt-4o-archlucid-prod");

        List<string> errors = RunCollect(Environments.Production, configuration);

        errors.Should().BeEmpty();
    }

    [Fact]
    public void Collect_when_development_real_simulator_sentinel_does_not_apply()
    {
        IConfiguration configuration = BuildConfiguration(
            d => d["AzureOpenAI:DeploymentName"] = AgentExecutionTraceModelMetadata.SimulatorDeploymentName);

        List<string> errors = RunCollect(Environments.Development, configuration);

        errors.Should().BeEmpty();
    }

    [Fact]
    public void Collect_when_production_real_echo_client_skips_deployment_fingerprint()
    {
        Dictionary<string, string?> data = ProductionRealBaseline();
        data["AgentExecution:CompletionClient"] = "Echo";
        data["AzureOpenAI:DeploymentName"] = AgentExecutionTraceModelMetadata.SimulatorDeploymentName;

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();

        List<string> errors = RunCollect(Environments.Production, configuration);

        errors.Should().BeEmpty();
    }

    [Fact]
    public void Collect_when_production_simulator_mode_skips_fingerprint()
    {
        Dictionary<string, string?> data = ProductionRealBaseline();
        data["AgentExecution:Mode"] = "Simulator";
        data["AzureOpenAI:DeploymentName"] = AgentExecutionTraceModelMetadata.SimulatorDeploymentName;

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();

        List<string> errors = RunCollect(Environments.Production, configuration);

        errors.Should().BeEmpty();
    }

    private static List<string> RunCollect(
        string aspNetCoreEnvironment,
        IConfiguration configuration)
    {
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(aspNetCoreEnvironment);
        List<string> errors = [];
        RealModeDeploymentFingerprintRules.Collect(configuration, env.Object, errors);

        return errors;
    }

    private static IConfiguration BuildConfiguration(Action<Dictionary<string, string?>>? tweak = null)
    {
        Dictionary<string, string?> data = ProductionRealBaseline();
        tweak?.Invoke(data);

        return new ConfigurationBuilder().AddInMemoryCollection(data).Build();
    }

    private static Dictionary<string, string?> ProductionRealBaseline()
    {
        return new Dictionary<string, string?>
        {
            ["AgentExecution:Mode"] = "Real",
            ["AzureOpenAI:Endpoint"] = "https://unit-test.openai.azure.com/",
            ["AzureOpenAI:ApiKey"] = "unit-test-key",
            ["AzureOpenAI:DeploymentName"] = "gpt-4o-valid",
        };
    }
}
