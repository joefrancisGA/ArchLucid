using ArchLucid.Core.Hosting;

using FluentAssertions;

using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;

namespace ArchLucid.Core.Tests.Hosting;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ProductionDangerousMisconfigurationLintTests
{
    [Fact]
    public void AppliesDangerousFailFast_development_default_is_false()
    {
        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(
                new Dictionary<string, string?>(StringComparer.OrdinalIgnoreCase))
            .Build();

        ProductionDangerousMisconfigurationLint.AppliesDangerousFailFast(Environments.Development, configuration)
            .Should()
            .BeFalse();
    }

    [Fact]
    public void AppliesDangerousFailFast_archlucid_production_on_development_aspnet_is_true()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ARCHLUCID_ENVIRONMENT"] = "Production",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();

        ProductionDangerousMisconfigurationLint.AppliesDangerousFailFast(Environments.Development, configuration)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void AppliesDangerousFailFast_staging_with_strict_is_true()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase) { ["ProductionValidation:Strict"] = "true" };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();

        ProductionDangerousMisconfigurationLint.AppliesDangerousFailFast(Environments.Staging, configuration)
            .Should()
            .BeTrue();
    }

    [Fact]
    public void DescribeFailFastFindings_staging_without_strict_does_not_apply()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ArchLucidAuth:Mode"] = "JwtBearer",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();

        ProductionDangerousMisconfigurationLint.DescribeFailFastFindings(configuration, Environments.Staging)
            .Should()
            .BeEmpty();
    }

    [Fact]
    public void DescribeFailFastFindings_production_development_bypass_emits_stable_rule_and_aspnet_env_hint()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ArchLucidAuth:Mode"] = "DevelopmentBypass",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();

        IReadOnlyList<HostingMisconfigurationWarning> warnings =
            ProductionDangerousMisconfigurationLint.DescribeFailFastFindings(configuration, Environments.Production);

        HostingMisconfigurationWarning first = warnings.Should().ContainSingle().Subject;
        first.RuleName.Should().Be(
            ProductionLikeHostingMisconfigurationAdvisorRuleNames.AuthModeDevelopmentBypassDisallowed);
        first.Message.Should().Contain("ASPNETCORE_ENVIRONMENT", StringComparison.Ordinal);
    }

    [Fact]
    public void DescribeFailFastFindings_staging_strict_jwt_without_authority_or_pem_emits_stable_rule_name()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ProductionValidation:Strict"] = "true",
            ["ArchLucidAuth:Mode"] = "JwtBearer",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();

        IReadOnlyList<HostingMisconfigurationWarning> warnings =
            ProductionDangerousMisconfigurationLint.DescribeFailFastFindings(configuration, Environments.Staging);

        HostingMisconfigurationWarning first = warnings.Should().ContainSingle().Subject;
        first.RuleName.Should().Be(ProductionLikeHostingMisconfigurationAdvisorRuleNames.JwtBearerMissingAuthorityAndPem);
    }

    [Fact]
    public void DescribeFailFastFindings_production_real_agent_without_redaction_emits_rule_name()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["AgentExecution:Mode"] = "Real",
            ["AgentExecution:CompletionClient"] = "AzureOpenAi",
            ["AzureOpenAI:Endpoint"] = "https://x.openai.azure.com",
            ["AzureOpenAI:ApiKey"] = "k",
            ["AzureOpenAI:DeploymentName"] = "d",
            ["LlmPromptRedaction:Enabled"] = "false",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();

        IReadOnlyList<HostingMisconfigurationWarning> warnings =
            ProductionDangerousMisconfigurationLint.DescribeFailFastFindings(configuration, Environments.Production);

        warnings.Should()
            .Contain(
                w => w.RuleName
                    == ProductionLikeHostingMisconfigurationAdvisorRuleNames.LlmPromptRedactionRequiredForRealMode);
    }

    [Fact]
    public void DescribeFailFastFindings_require_telemetry_export_when_unconfigured_emits_rule_name()
    {
        Dictionary<string, string?> data = new(StringComparer.OrdinalIgnoreCase)
        {
            ["ProductionValidation:RequireTelemetryExport"] = "true",
        };

        IConfiguration configuration = new ConfigurationBuilder().AddInMemoryCollection(data).Build();

        IReadOnlyList<HostingMisconfigurationWarning> warnings =
            ProductionDangerousMisconfigurationLint.DescribeFailFastFindings(configuration, Environments.Production);

        warnings.Should()
            .Contain(w => w.RuleName == ProductionLikeHostingMisconfigurationAdvisorRuleNames.TelemetryExportRequiredMissing);
    }
}
