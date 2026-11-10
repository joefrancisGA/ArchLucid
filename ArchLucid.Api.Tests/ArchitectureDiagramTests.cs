using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Models;
using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture Diagram.
/// </summary>
[Trait("Category", "Integration")]
public sealed class ArchitectureDiagramTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task GetManifestDiagram_ReturnsMermaid()
    {
        (_, string manifestVersion) = await CreateFinalizedRunAsync("REQ-DIAGRAM-001");

        HttpResponseMessage diagramResponse =
            await Client.GetAsync($"/v1/architecture/manifest/{manifestVersion}/diagram");

        diagramResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        DiagramResponse? diagramPayload = await diagramResponse.ReadJsonForTestAsync<DiagramResponse>(JsonOptions);
        diagramPayload.Should().NotBeNull();
        diagramPayload.Format.Should().Be("mermaid");
        diagramPayload.Diagram.Should().Contain("flowchart LR");
        diagramPayload.Diagram.Should().Contain("rag-api");
        diagramPayload.Diagram.Should().Contain("rag-search");
        diagramPayload.Diagram.Should().Contain("rag-metadata");
    }

    [SkippableFact]
    public async Task GetManifestDiagramV2_ReturnsManifestDiagramResponse_WithOptions()
    {
        (_, string manifestVersion) = await CreateFinalizedRunAsync("REQ-DIAGRAM-002");

        HttpResponseMessage diagramResponse = await Client.GetAsync(
            $"/v1/architecture/manifest/{manifestVersion}/diagram/v2?layout=TB&includeRuntimePlatform=false&relationshipLabels=none&groupBy=serviceType");

        diagramResponse.StatusCode.Should().Be(HttpStatusCode.OK);

        ManifestDiagramResponse? diagramPayload =
            await diagramResponse.ReadJsonForTestAsync<ManifestDiagramResponse>(JsonOptions);
        diagramPayload.Should().NotBeNull();
        diagramPayload.DiagramType.Should().Be("Mermaid");
        diagramPayload.Content.Should().Contain("flowchart TB");
        diagramPayload.Content.Should().Contain("subgraph");
        diagramPayload.Content.Should().Contain("rag-api");
    }
}
