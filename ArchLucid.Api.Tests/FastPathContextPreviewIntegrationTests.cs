using System.Net;
using System.Net.Http.Json;

using ArchLucid.Contracts.Ingestion;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>Smoke coverage for heuristic context preview (Pilot-friendly; no Standard tier gate).</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class FastPathContextPreviewIntegrationTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task Post_preview_returns_elements_for_https_github_url()
    {
        HttpResponseMessage response = await Client.PostAsync(
            "/v1/architecture/fast-path/context-preview",
            JsonContent(new FastPathContextPreviewRequest { RepositoryUrl = "https://github.com/contoso/order-service" }));

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        FastPathContextPreviewResponse? body =
            await response.Content.ReadFromJsonAsync<FastPathContextPreviewResponse>(JsonOptions);
        body.Should().NotBeNull();
        body!.Elements.Should().NotBeEmpty();
        body.SourceUrl.Should().Contain("github.com");
    }

    [SkippableFact]
    public async Task Post_preview_returns_400_for_invalid_url()
    {
        HttpResponseMessage response = await Client.PostAsync(
            "/v1/architecture/fast-path/context-preview",
            JsonContent(new FastPathContextPreviewRequest { RepositoryUrl = "ftp://bad" }));

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }
}
