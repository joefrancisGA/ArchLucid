using System.Text.Json.Nodes;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc.Testing;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Small semantic checks on <c>/openapi/v1.json</c> that should hold even when the committed snapshot advances.
///     Complements <see cref="OpenApiContractSnapshotTests" /> (additive-safe backward-compat diff after
///     <see cref="OpenApiJsonCanonicalizer" />).
/// </summary>
[Trait("Suite", "Core")]
public sealed class OpenApiContractInvariantsTests(OpenApiContractWebAppFactory factory)
    : IClassFixture<OpenApiContractWebAppFactory>
{
    private const string OpenApiDocumentPath = "/openapi/v1.json";

    [SkippableFact]
    public async Task OpenApi_v1_json_exposes_core_metadata_and_register_route()
    {
        using HttpClient client = factory.CreateClient(
            new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        using HttpResponseMessage response = await client.GetAsync(OpenApiDocumentPath);
        await response.EnsureSuccessForTestAsync();
        string body = await response.Content.ReadAsStringAsync();
        JsonNode? root = JsonNode.Parse(body);
        root.Should().NotBeNull();

        string? openApiVersion = root["openapi"]?.GetValue<string>();
        openApiVersion.Should().Be("3.1.1");

        string? title = root["info"]?["title"]?.GetValue<string>();
        title.Should().NotBeNullOrWhiteSpace();
        title.Should().StartWith("ArchLucid", "public API title should reflect product name");

        JsonObject? paths = root["paths"]?.AsObject();
        paths.Should().NotBeNull();
        paths.ContainsKey("/v1/register").Should().BeTrue("self-service registration remains a documented entrypoint");

        JsonNode? executePost = paths["/v1/architecture/run/{runId}/execute"]?["post"];
        executePost.Should().NotBeNull();
        JsonObject? executeResponses = executePost["responses"]?.AsObject();
        executeResponses.Should().NotBeNull();
        executeResponses.ContainsKey("409").Should().BeTrue(
            "execute documents 409 for quality-gate rejection (Problem Details); regen snapshot if this fails");

        JsonNode? architectureRunSchema = root["components"]?["schemas"]?["ArchitectureRun"]?.AsObject();
        architectureRunSchema.Should().NotBeNull();
        JsonObject properties = architectureRunSchema["properties"]!.AsObject();
        properties.ContainsKey("structuralExecutionMode").Should().BeTrue("INV-002 requires ArchitectureRun.structuralExecutionMode on the wire");

        JsonArray? required = architectureRunSchema["required"]?.AsArray();
        required.Should().NotBeNull();
        required.Any(n => string.Equals(n?.GetValue<string>(), "structuralExecutionMode", StringComparison.Ordinal)).Should()
            .BeTrue("structuralExecutionMode must be required on ArchitectureRun in OpenAPI");

        JsonNode? submitPost = paths["/v1/runs/{runId}/submit"]?["post"];
        submitPost.Should().NotBeNull();
        JsonObject? submitResponses = submitPost["responses"]?.AsObject();
        submitResponses.Should().NotBeNull();
        submitResponses.ContainsKey("409").Should().BeTrue(
            "runs submit alias documents 409 for quality-gate rejection; regen snapshot if this fails");
    }

    [SkippableFact]
    public async Task OpenApi_v1_json_documents_required_fields_on_high_traffic_schemas()
    {
        using HttpClient client = factory.CreateClient(
            new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });

        using HttpResponseMessage response = await client.GetAsync(OpenApiDocumentPath);
        await response.EnsureSuccessForTestAsync();
        string body = await response.Content.ReadAsStringAsync();
        JsonNode? root = JsonNode.Parse(body);
        root.Should().NotBeNull();

        JsonObject? schemas = root!["components"]?["schemas"]?.AsObject();
        schemas.Should().NotBeNull();

        AssertRequiredProperties(
            schemas!,
            "RunSummaryResponse",
            "runId",
            "projectId",
            "createdUtc");

        AssertRequiredProperties(
            schemas,
            "RunRecord",
            "runId",
            "projectId",
            "createdUtc",
            "structuralExecutionMode");

        AssertRequiredProperties(
            schemas,
            "ManifestSummaryResponse",
            "manifestId",
            "runId",
            "createdUtc",
            "manifestHash",
            "ruleSetId",
            "ruleSetVersion",
            "status",
            "decisionCount",
            "warningCount",
            "unresolvedIssueCount");

        JsonObject? runSummarySchema = schemas["RunSummaryResponse"]?.AsObject();
        runSummarySchema.Should().NotBeNull();
        JsonObject runSummaryProperties = runSummarySchema!["properties"]!.AsObject();
        runSummaryProperties.ContainsKey("isSample").Should().BeTrue();
        runSummaryProperties.ContainsKey("hasWarnings").Should().BeTrue();
        runSummaryProperties.ContainsKey("hasGovernanceWarnings").Should().BeTrue();

        JsonObject? runDetailSchema = schemas["RunDetailDto"]?.AsObject();
        runDetailSchema.Should().NotBeNull();
        JsonObject runDetailProperties = runDetailSchema!["properties"]!.AsObject();
        runDetailProperties.ContainsKey("retrievalGroundingSummary").Should().BeTrue();
        runDetailProperties.ContainsKey("lastAgentExecutionFailure").Should().BeTrue();

        JsonObject? pilotDeltasSchema = schemas["PilotRunDeltasResponse"]?.AsObject();
        pilotDeltasSchema.Should().NotBeNull();
        JsonObject pilotDeltasProperties = pilotDeltasSchema!["properties"]!.AsObject();
        pilotDeltasProperties.ContainsKey("roiSourceFreshnessDisposition").Should().BeTrue();
    }

    private static void AssertRequiredProperties(JsonObject schemas, string schemaName, params string[] expected)
    {
        JsonObject? schema = schemas[schemaName]?.AsObject();
        schema.Should().NotBeNull($"{schemaName} must be documented in OpenAPI components");

        JsonArray? required = schema!["required"]?.AsArray();
        required.Should().NotBeNull($"{schemaName} must declare a required array");

        foreach (string propertyName in expected)
        {
            required!.Any(n => string.Equals(n?.GetValue<string>(), propertyName, StringComparison.Ordinal)).Should()
                .BeTrue($"{propertyName} must be required on {schemaName} in OpenAPI");
        }
    }
}
