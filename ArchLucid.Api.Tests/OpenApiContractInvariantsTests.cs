using System.Text.Json.Nodes;

using FluentAssertions;

using Microsoft.AspNetCore.Mvc.Testing;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Small semantic checks on <c>/openapi/v1.json</c> that should hold even when the full snapshot is regenerated.
///     Complements <see cref="OpenApiContractSnapshotTests" /> (canonical JSON equality after
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
        JsonObject? executeResponses = executePost!["responses"]?.AsObject();
        executeResponses.Should().NotBeNull();
        executeResponses!.ContainsKey("409").Should().BeTrue(
            "execute documents 409 for quality-gate rejection (Problem Details); regen snapshot if this fails");

        JsonNode? submitPost = paths["/v1/runs/{runId}/submit"]?["post"];
        submitPost.Should().NotBeNull();
        JsonObject? submitResponses = submitPost!["responses"]?.AsObject();
        submitResponses.Should().NotBeNull();
        submitResponses!.ContainsKey("409").Should().BeTrue(
            "runs submit alias documents 409 for quality-gate rejection; regen snapshot if this fails");
    }
}
