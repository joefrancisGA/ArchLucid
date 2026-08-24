using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Hosting;
using ArchLucid.Host.Core.Startup.Validation;

using FluentAssertions;

using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]

/// <summary>Agent execution mode, Azure OpenAI, LLM cache, and token/budget quota rules.</summary>
public sealed partial class ArchLucidConfigurationRulesTests
{
    [SkippableFact]
    public void CollectErrors_WhenAgentExecutionModeIsInvalid_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["AgentExecution:Mode"] = "Banana"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("AgentExecution:Mode", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenAgentExecutionModeIsRealWithoutAzureOpenAi_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["AgentExecution:Mode"] = "Real"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("AzureOpenAI", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenAgentExecutionModeRealWithoutAzureOpenAi_error_namesShellEnvVars()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["AgentExecution:Mode"] = "Real"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        string? msg = errors.FirstOrDefault(e => e.Contains("AZURE_OPENAI_ENDPOINT", StringComparison.Ordinal));
        msg.Should().NotBeNull();
        msg.Should().Contain("AZURE_OPENAI_API_KEY");
        msg.Should().Contain("AZURE_OPENAI_DEPLOYMENT_NAME");
    }

    [SkippableFact]
    public void LogAgentExecutionRealModeInformation_WhenRealWithAzureOpenAiConfigured_doesNotThrow()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["AgentExecution:Mode"] = "Real",
            ["AzureOpenAI:Endpoint"] = "https://example.openai.azure.com/",
            ["AzureOpenAI:ApiKey"] = "key",
            ["AzureOpenAI:DeploymentName"] = "dep"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();

        Action act = () => ArchLucidConfigurationRules.LogAgentExecutionRealModeInformation(
            configuration,
            NullLogger.Instance);

        act.Should().NotThrow();
    }

    [SkippableFact]
    public void CollectErrors_WhenProductionRealAndDeploymentIsTraceSentinel_contains_fingerprint_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "Sql",
            ["ConnectionStrings:ArchLucid"] =
                "Server=.;Database=ArchLucidConfigurationRulesTests;Trusted_Connection=True;TrustServerCertificate=True",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
            ["ArchLucidAuth:Authority"] = "https://login.example.com",
            ["ArchLucid:ContentSafety:Endpoint"] = "https://content-safety.example",
            ["ArchLucid:ContentSafety:ApiKey"] = "key",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false",
            ["LlmCompletionCache:Enabled"] = "false",
            ["AgentExecution:Mode"] = "Real",
            ["AzureOpenAI:Endpoint"] = "https://example.openai.azure.com/",
            ["AzureOpenAI:ApiKey"] = "key",
            ["AzureOpenAI:DeploymentName"] = AgentExecutionTraceModelMetadata.SimulatorDeploymentName,
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Production);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("AGENT_TRACE_FORENSICS.md", StringComparison.OrdinalIgnoreCase)
                                     && e.Contains("AzureOpenAI:DeploymentName", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenDevelopmentRealAndDeploymentIsTraceSentinel_does_not_add_fingerprint_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["LlmCompletionCache:Enabled"] = "false",
            ["AgentExecution:Mode"] = "Real",
            ["AzureOpenAI:Endpoint"] = "https://example.openai.azure.com/",
            ["AzureOpenAI:ApiKey"] = "key",
            ["AzureOpenAI:DeploymentName"] = AgentExecutionTraceModelMetadata.SimulatorDeploymentName,
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().NotContain(e => e.Contains("AGENT_TRACE_FORENSICS.md", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenRealModeWithManagedIdentity_allows_missing_api_key()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["AgentExecution:Mode"] = "Real",
            ["AzureOpenAI:Endpoint"] = "https://example.openai.azure.com/",
            ["AzureOpenAI:DeploymentName"] = "dep",
            ["AzureOpenAI:AuthenticationMode"] = "ManagedIdentity",
            ["LlmCompletionCache:Enabled"] = "false",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().NotContain(e => e.Contains("Azure OpenAI is not fully configured", StringComparison.Ordinal));
    }

    [SkippableFact]
    public void CollectErrors_WhenRealModeWithEchoCompletionClient_allows_missing_AzureOpenAi()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["AgentExecution:Mode"] = "Real",
            ["AgentExecution:CompletionClient"] = "Echo",
            ["LlmCompletionCache:Enabled"] = "false",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().NotContain(e => e.Contains("AzureOpenAI", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenRealModeAndMaxCompletionTokensNegative_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["AgentExecution:Mode"] = "Real",
            ["AzureOpenAI:Endpoint"] = "https://example.openai.azure.com/",
            ["AzureOpenAI:ApiKey"] = "key",
            ["AzureOpenAI:DeploymentName"] = "dep",
            ["AzureOpenAI:MaxCompletionTokens"] = "-1",
            ["LlmCompletionCache:Enabled"] = "false",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("MaxCompletionTokens", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenLlmCompletionCacheMaxEntriesZero_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["LlmCompletionCache:Enabled"] = "true",
            ["LlmCompletionCache:MaxEntries"] = "0",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("LlmCompletionCache:MaxEntries", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenLlmCompletionCacheDistributedWithoutRedis_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["LlmCompletionCache:Enabled"] = "true",
            ["LlmCompletionCache:Provider"] = "Distributed",
            ["Cors:AllowedOrigins:0"] = "https://ops.example.com",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should()
            .Contain(e => e.Contains(
                "LlmCompletionCache:Provider Distributed requires",
                StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenLlmTokenQuotaEnabledWithoutPositiveMax_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["LlmTokenQuota:Enabled"] = "true",
            ["LlmTokenQuota:MaxPromptTokensPerTenantPerWindow"] = "0",
            ["LlmTokenQuota:MaxCompletionTokensPerTenantPerWindow"] = "0",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e =>
            e.Contains("LlmTokenQuota:MaxPromptTokensPerTenantPerWindow", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenLlmTokenQuotaEnabledWithInvalidWindow_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["LlmTokenQuota:Enabled"] = "true",
            ["LlmTokenQuota:WindowMinutes"] = "0",
            ["LlmTokenQuota:MaxPromptTokensPerTenantPerWindow"] = "100",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e => e.Contains("LlmTokenQuota:WindowMinutes", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenLlmTokenQuotaDisabled_skips_quota_validation()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["LlmTokenQuota:Enabled"] = "false",
            ["LlmTokenQuota:WindowMinutes"] = "0",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().NotContain(e => e.Contains("LlmTokenQuota", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenLlmDailyTenantBudgetEnabledWithoutPositiveHardCutoff_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["LlmDailyTenantBudget:Enabled"] = "true",
            ["LlmDailyTenantBudget:HardCutoffTokensPerUtcDay"] = "0",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e =>
            e.Contains("LlmDailyTenantBudget:HardCutoffTokensPerUtcDay", StringComparison.OrdinalIgnoreCase));
    }

    [SkippableFact]
    public void CollectErrors_WhenLlmDailyTenantBudgetDisabled_skips_daily_budget_validation()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["LlmDailyTenantBudget:Enabled"] = "false",
            ["LlmDailyTenantBudget:HardCutoffTokensPerUtcDay"] = "0",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().NotContain(e => e.Contains("LlmDailyTenantBudget", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void CollectErrors_WhenLlmMonthlyTenantDollarBudgetEnabledWithoutCostEstimation_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["LlmMonthlyTenantDollarBudget:Enabled"] = "true",
            ["LlmMonthlyTenantDollarBudget:IncludedUsdPerUtcMonth"] = "50",
            ["LlmMonthlyTenantDollarBudget:HardCutoffUsdPerUtcMonth"] = "75",
            ["AgentExecution:LlmCostEstimation:Enabled"] = "false",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e =>
            e.Contains("LlmCostEstimation:Enabled", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void CollectErrors_WhenLlmMonthlyTenantDollarBudgetHardBelowIncluded_contains_error()
    {
        Dictionary<string, string?> data = new()
        {
            ["ArchLucid:StorageProvider"] = "InMemory",
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
            ["LlmMonthlyTenantDollarBudget:Enabled"] = "true",
            ["LlmMonthlyTenantDollarBudget:IncludedUsdPerUtcMonth"] = "80",
            ["LlmMonthlyTenantDollarBudget:HardCutoffUsdPerUtcMonth"] = "50",
            ["WebhookDelivery:UseHttpClient"] = "false"
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();
        Mock<IWebHostEnvironment> env = new();
        env.Setup(e => e.EnvironmentName).Returns(Environments.Development);

        IReadOnlyList<string> errors = ArchLucidConfigurationRules.CollectErrors(configuration, env.Object);

        errors.Should().Contain(e =>
            e.Contains("HardCutoffUsdPerUtcMonth", StringComparison.OrdinalIgnoreCase));
    }
}
