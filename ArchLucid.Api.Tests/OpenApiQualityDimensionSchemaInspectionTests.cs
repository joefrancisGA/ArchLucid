using System.Text.Json.Nodes;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc.Testing;

namespace ArchLucid.Api.Tests;

/// <summary>Guards PolicyPack qualityDimension against ArchitectureIntelligence enum collision in MapOpenApi.</summary>
[Trait("Category", "Integration")]
public sealed class OpenApiQualityDimensionSchemaInspectionTests(OpenApiContractWebAppFactory factory)
    : IClassFixture<OpenApiContractWebAppFactory>
{
    private const string OpenApiDocumentPath = "/openapi/v1.json";

    [SkippableFact]
    public async Task PolicyPack_qualityDimension_schema_includes_sustainability_baseline()
    {
        using HttpClient client = factory.CreateClient(
            new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        using HttpResponseMessage response = await client.GetAsync(OpenApiDocumentPath);
        await response.EnsureSuccessForTestAsync();

        string body = await response.Content.ReadAsStringAsync();
        JsonNode? root = JsonNode.Parse(body);
        root.Should().NotBeNull();

        JsonObject? policyPackSchema = root!["components"]?["schemas"]?["PolicyPack"]?.AsObject();
        policyPackSchema.Should().NotBeNull();

        string? qualityDimensionRef = policyPackSchema!["properties"]?["qualityDimension"]?["anyOf"]?[1]?["$ref"]
            ?.GetValue<string>()
            ?? policyPackSchema["properties"]?["qualityDimension"]?["$ref"]?.GetValue<string>();

        qualityDimensionRef.Should().NotBeNullOrWhiteSpace();
        qualityDimensionRef.Should().EndWith("/GovernanceQualityDimension");

        JsonObject? qualityDimensionSchema = root["components"]?["schemas"]?["GovernanceQualityDimension"]?.AsObject();
        qualityDimensionSchema.Should().NotBeNull();

        JsonArray enumValues = qualityDimensionSchema!["enum"]!.AsArray();

        enumValues
            .Select(node => node?.GetValue<string>())
            .Should()
            .Contain("SustainabilityAndResourceEfficiency");
    }
}
