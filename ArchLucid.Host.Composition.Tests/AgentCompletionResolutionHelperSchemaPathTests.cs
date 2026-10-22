using ArchLucid.Core.Configuration;
using ArchLucid.Host.Composition.AzureOpenAI;
using ArchLucid.Host.Composition.Startup.Modules.Agents;

using FluentAssertions;

using Microsoft.Extensions.Configuration;

namespace ArchLucid.Host.Composition.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentCompletionResolutionHelperSchemaPathTests
{
    [Fact]
    public void ResolveStructuredOutputAgentResultSchema_null_bound_schema_path_falls_back_without_null_reference()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["SchemaValidation:AgentResultSchemaPath"] = null,
                })
            .Build();

        AzureOpenAiOptions azureOpenAiOptions = new() { UseJsonSchemaResponseFormat = true };

        BinaryData? schema = AgentCompletionResolutionHelper.ResolveStructuredOutputAgentResultSchema(
            configuration,
            azureOpenAiOptions);

        schema.Should().NotBeNull();
    }

    [Fact]
    public void TenantAzureOpenAiStructuredOutputSchema_null_bound_schema_path_falls_back_without_null_reference()
    {
        IConfiguration configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(
                new Dictionary<string, string?>
                {
                    ["SchemaValidation:AgentResultSchemaPath"] = null,
                })
            .Build();

        AzureOpenAiOptions azureOpenAiOptions = new() { UseJsonSchemaResponseFormat = true };

        BinaryData? schema = TenantAzureOpenAiStructuredOutputSchema.Resolve(configuration, azureOpenAiOptions);

        schema.Should().NotBeNull();
    }
}
