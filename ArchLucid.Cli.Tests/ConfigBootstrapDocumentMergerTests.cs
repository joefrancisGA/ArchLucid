using System.Text.Json;

using ArchLucid.Cli.Commands;

using FluentAssertions;

namespace ArchLucid.Cli.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ConfigBootstrapDocumentMergerTests
{
    [Fact]
    public void Merge_preserves_unrelated_keys()
    {
        const string existing =
            """
            {
              "Other": { "A": 1 },
              "ConnectionStrings": { "OtherDb": "x" },
              "AzureOpenAI": { "MaxCompletionTokens": 8000 }
            }
            """;

        ConfigBootstrapAnswers answers = new()
        {
            ConnectionStringsArchLucid =
                "Server=.;Database=ArchLucid;Trusted_Connection=True;TrustServerCertificate=True;",
            AzureOpenAiEndpoint = "https://unit.openai.azure.com",
            AzureOpenAiApiKey = "key-one",
            AzureOpenAiDeploymentName = "gpt-deploy",
        };

        string merged = ConfigBootstrapDocumentMerger.MergeToIndentedJson(existing, answers);

        JsonDocument doc = JsonDocument.Parse(merged);
        JsonElement root = doc.RootElement;

        root.GetProperty("Other").GetProperty("A").GetInt32().Should().Be(1);
        root.GetProperty("ConnectionStrings").GetProperty("OtherDb").GetString().Should().Be("x");
        root.GetProperty("ConnectionStrings").GetProperty("ArchLucid").GetString().Should().Contain("Server=.");
        root.GetProperty("AzureOpenAI").GetProperty("MaxCompletionTokens").GetInt32().Should().Be(8000);
        root.GetProperty("AzureOpenAI").GetProperty("Endpoint").GetString().Should().Be("https://unit.openai.azure.com");
        root.GetProperty("AzureOpenAI").GetProperty("ApiKey").GetString().Should().Be("key-one");
        root.GetProperty("AzureOpenAI").GetProperty("DeploymentName").GetString().Should().Be("gpt-deploy");
    }

    [Fact]
    public void Merge_starts_from_empty_when_no_existing_json()
    {
        ConfigBootstrapAnswers answers = new()
        {
            ConnectionStringsArchLucid =
                "Server=.;Database=ArchLucid;Trusted_Connection=True;TrustServerCertificate=True;",
            AzureOpenAiEndpoint = "https://unit.openai.azure.com/",
            AzureOpenAiApiKey = "secret",
            AzureOpenAiDeploymentName = "x",
        };

        string merged = ConfigBootstrapDocumentMerger.MergeToIndentedJson(null, answers);

        JsonDocument doc = JsonDocument.Parse(merged);
        JsonElement root = doc.RootElement;

        root.GetProperty("ConnectionStrings").GetProperty("ArchLucid").GetString().Should().NotBeNullOrWhiteSpace();
        root.GetProperty("AzureOpenAI").GetProperty("Endpoint").GetString().Should().Contain("openai.azure.com");
    }

    [Fact]
    public void ValidateHttpsResourceEndpoint_rejects_http()
    {
        FluentActions.Invoking(() => ConfigBootstrapDocumentMerger.ValidateHttpsResourceEndpoint("http://x.openai.azure.com/"))
            .Should().Throw<ArgumentException>()
            .WithMessage("*HTTPS*");
    }

    [Fact]
    public void Merge_throws_on_invalid_existing_json()
    {
        ConfigBootstrapAnswers answers = new()
        {
            ConnectionStringsArchLucid =
                "Server=.;Database=ArchLucid;Trusted_Connection=True;TrustServerCertificate=True;",
            AzureOpenAiEndpoint = "https://unit.openai.azure.com/",
            AzureOpenAiApiKey = "k",
            AzureOpenAiDeploymentName = "d",
        };

        FluentActions.Invoking(() => ConfigBootstrapDocumentMerger.MergeToIndentedJson("{ not json", answers))
            .Should().Throw<Exception>();
    }
}
