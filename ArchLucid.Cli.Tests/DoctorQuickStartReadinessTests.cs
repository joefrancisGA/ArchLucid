using ArchLucid.Cli.Diagnostics;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Cli.Tests;

[Trait("Suite", "Core")]
public sealed class DoctorQuickStartReadinessTests
{
    [Fact]
    public void EvaluateAuthMode_DevelopmentBypass_InDevelopment_Passes()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ARCHLUCID_ENVIRONMENT"] = string.Empty,
                    ["ASPNETCORE_ENVIRONMENT"] = "Development",
                    ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
                })
            .Build();

        DoctorReadinessLine line = DoctorQuickStartReadiness.EvaluateAuthMode(configuration, "Development");

        line.Ok.Should().BeTrue();
        line.Detail.Should().Contain("DevelopmentBypass");
    }

    [Fact]
    public void EvaluateAuthMode_DevelopmentBypass_InStaging_Fails()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ARCHLUCID_ENVIRONMENT"] = string.Empty,
                    ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
                })
            .Build();

        DoctorReadinessLine line = DoctorQuickStartReadiness.EvaluateAuthMode(configuration, "Staging");

        line.Ok.Should().BeFalse();
        line.Detail.Should().Contain("DevelopmentBypass");
    }

    [Fact]
    public void EvaluateAuthMode_OmittedMode_InStaging_Fails()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ARCHLUCID_ENVIRONMENT"] = string.Empty,
                    ["ASPNETCORE_ENVIRONMENT"] = "Staging",
                })
            .Build();

        DoctorReadinessLine line = DoctorQuickStartReadiness.EvaluateAuthMode(configuration, "Staging");

        line.Ok.Should().BeFalse();
        line.Detail.Should().Contain("JwtBearer");
    }

    [Fact]
    public void ShouldProbeOpenAiEndpoint_RealMode_Probes()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["AgentExecution:Mode"] = "Real",
                })
            .Build();

        DoctorQuickStartReadiness.ShouldProbeOpenAiEndpoint(configuration).Should().BeTrue();
    }

    [Fact]
    public void ShouldProbeOpenAiEndpoint_RealWithEcho_DoesNotProbe()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["AgentExecution:Mode"] = "Real",
                    ["AgentExecution:CompletionClient"] = "Echo",
                })
            .Build();

        DoctorQuickStartReadiness.ShouldProbeOpenAiEndpoint(configuration).Should().BeFalse();
    }

    [Fact]
    public void ShouldProbeOpenAiEndpoint_Simulator_DoesNotProbe()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["AgentExecution:Mode"] = "Simulator",
                })
            .Build();

        DoctorQuickStartReadiness.ShouldProbeOpenAiEndpoint(configuration).Should().BeFalse();
    }

    [Fact]
    public void EvaluateRequiredConfigurationKeys_RealLlm_FlagsMissingAzureOpenAI()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ASPNETCORE_ENVIRONMENT"] = "Development",
                    ["ArchLucid:StorageProvider"] = "InMemory",
                    ["AgentExecution:Mode"] = "Real",
                })
            .Build();

        DoctorReadinessLine line =
            DoctorQuickStartReadiness.EvaluateRequiredConfigurationKeys(configuration, "Development");

        line.Ok.Should().BeFalse();
        line.Detail.Should().Contain("AzureOpenAI:Endpoint");
        line.Detail.Should().Contain("AzureOpenAI:ApiKey");
        line.Detail.Should().Contain("AzureOpenAI:DeploymentName");
    }

    [Fact]
    public void EvaluateRequiredConfigurationKeys_ApiKeyEnabled_RequiresKeyMaterial()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ASPNETCORE_ENVIRONMENT"] = "Development",
                    ["ArchLucid:StorageProvider"] = "InMemory",
                    ["Authentication:ApiKey:Enabled"] = "true",
                })
            .Build();

        DoctorReadinessLine line =
            DoctorQuickStartReadiness.EvaluateRequiredConfigurationKeys(configuration, "Development");

        line.Ok.Should().BeFalse();
        line.Detail.Should().Contain("AdminKey");
    }

    [Fact]
    public async Task WriteSectionAsync_WithHooks_PrintsInjectedSqlRows()
    {
        StringWriter output = new();
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["ASPNETCORE_ENVIRONMENT"] = "Development",
                    ["ArchLucid:StorageProvider"] = "InMemory",
                })
            .Build();

        DoctorQuickStartReadinessHooks hooks = new()
        {
            SqlAsync = (_, _, _) => Task.FromResult((
                new DoctorReadinessLine(true, "Connection string", "injected-conn"),
                new DoctorReadinessLine(true, "Storage / schema", "injected-schema"))),
            OpenAiAsync = (_, _) => Task.FromResult(new DoctorReadinessLine(true, "OpenAI endpoint", "injected-openai")),
        };

        await DoctorQuickStartReadiness.WriteSectionAsync(output, configuration, CancellationToken.None, hooks);

        string text = output.ToString();
        text.Should().Contain("Quick-start readiness");
        text.Should().Contain("injected-conn");
        text.Should().Contain("injected-schema");
        text.Should().Contain("injected-openai");
    }

    [Fact]
    public void DoctorReadinessLine_Format_UsesCheckmarks()
    {
        DoctorReadinessLine ok = new(true, "Label", "detail");
        ok.Format().Should().StartWith("\u2713");

        DoctorReadinessLine bad = new(false, "Label", "detail");
        bad.Format().Should().StartWith("\u2717");
    }
}
