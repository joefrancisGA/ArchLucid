using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Configuration;
using ArchLucid.Host.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Host.Core.Tests.Configuration;

[Trait("Category", "Unit")]
public sealed class AzureOpenAiEnvironmentConfigurationBridgeTests
{
    [Fact]
    public void Apply_maps_flat_azure_openai_env_vars_when_nested_keys_unset()
    {
        ConfigurationManager configuration = new();

        configuration["AZURE_OPENAI_ENDPOINT"] = "https://example.openai.azure.com/";
        configuration["AZURE_OPENAI_API_KEY"] = "test-key";
        configuration["AZURE_OPENAI_DEPLOYMENT_NAME"] = "gpt-4o";

        AzureOpenAiEnvironmentConfigurationBridge.Apply(configuration);

        configuration[$"{AzureOpenAiOptions.SectionName}:Endpoint"].Should().Be("https://example.openai.azure.com/");
        configuration[$"{AzureOpenAiOptions.SectionName}:ApiKey"].Should().Be("test-key");
        configuration[$"{AzureOpenAiOptions.SectionName}:DeploymentName"].Should().Be("gpt-4o");
    }

    [Fact]
    public void Apply_does_not_override_existing_nested_azure_openai_settings()
    {
        ConfigurationManager configuration = new();

        configuration[$"{AzureOpenAiOptions.SectionName}:DeploymentName"] = "primary-deploy";
        configuration["AZURE_OPENAI_DEPLOYMENT_NAME"] = "gpt-4o";

        AzureOpenAiEnvironmentConfigurationBridge.Apply(configuration);

        configuration[$"{AzureOpenAiOptions.SectionName}:DeploymentName"].Should().Be("primary-deploy");
    }
}
