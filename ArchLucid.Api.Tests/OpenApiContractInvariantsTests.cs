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
        response.EnsureSuccessStatusCode();

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
}
