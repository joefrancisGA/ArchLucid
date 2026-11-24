using ArchLucid.Core.Configuration;

using Microsoft.Extensions.Configuration;

using Xunit;

namespace ArchLucid.Core.Tests.Configuration;

[Trait("Category", "Unit")]
public sealed class AzureOpenAiConfigurationProbeTests
{
    [Fact]
    public void IsCompletionStackConfigured_accepts_managed_identity_without_api_key()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["AzureOpenAI:Endpoint"] = "https://resource.openai.azure.com/",
                    ["AzureOpenAI:DeploymentName"] = "gpt",
                    ["AzureOpenAI:AuthenticationMode"] = "ManagedIdentity",
                })
            .Build();

        Assert.True(AzureOpenAiConfigurationProbe.IsCompletionStackConfigured(configuration));
        Assert.False(AzureOpenAiConfigurationProbe.IsEmbeddingsStackConfigured(configuration));
    }

    [Fact]
    public void IsEmbeddingsStackConfigured_requires_api_key_in_api_key_mode()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["AzureOpenAI:Endpoint"] = "https://resource.openai.azure.com/",
                    ["AzureOpenAI:EmbeddingDeploymentName"] = "embed",
                })
            .Build();

        Assert.False(AzureOpenAiConfigurationProbe.IsEmbeddingsStackConfigured(configuration));
    }

    [Theory]
    [InlineData("Real", "Azure", "ManagedIdentity", false)]
    [InlineData("Real", "Azure", " managedidentity ", false)]
    [InlineData("Real", "Azure", "ApiKey", true)]
    [InlineData("Real", "Azure", null, true)]
    [InlineData("Real", "Echo", "ApiKey", false)]
    [InlineData("Simulator", "Azure", "ApiKey", false)]
    public void Catalog_requires_api_key_only_for_real_non_echo_without_managed_identity(
        string mode, string client, string? authenticationMode, bool expected)
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["AgentExecution:Mode"] = mode,
                ["AgentExecution:CompletionClient"] = client,
                ["AzureOpenAI:AuthenticationMode"] = authenticationMode
            })
            .Build();

        ConfigurationKeyEntry key = ConfigurationKeyCatalog.All.Single(
            entry => entry.ConfigPath == "AzureOpenAI:ApiKey");
        Assert.Equal(expected, ConfigurationKeyRequirement.IsKeyRequired(key, configuration, "Production"));

        ConfigurationKeyEntry endpoint = ConfigurationKeyCatalog.All.Single(
            entry => entry.ConfigPath == "AzureOpenAI:Endpoint");
        Assert.Equal(mode == "Real" && client != "Echo",
            ConfigurationKeyRequirement.IsKeyRequired(endpoint, configuration, "Production"));
    }
}
