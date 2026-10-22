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
}
