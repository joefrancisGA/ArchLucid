using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Models;
using ArchLucid.Api.Tests.TestDtos;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture Summary.
/// </summary>
[Trait("Category", "Integration")]
public sealed class ArchitectureSummaryTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task GetManifestSummary_ReturnsMarkdown()
    {
        string requestId = TestRequestIds.ForScenario(nameof(ArchitectureSummaryTests));
        string systemName = TestRequestFactory.SystemNameForRequest(requestId);

        FinalizedRun finalized = await ArrangeFinalizedAsync();

        HttpResponseMessage summaryResponse =
            await Client.GetAsync($"/v1/architecture/manifest/{finalized.ManifestVersion}/summary");
        ManifestMarkdownDocumentResponse? summaryPayload =
            await summaryResponse.ReadJsonForTestAsync<ManifestMarkdownDocumentResponse>(JsonOptions);
        summaryPayload.Should().NotBeNull();
        summaryPayload.Format.Should().Be("markdown");
        summaryPayload.Content.Should().Contain($"# Architecture Summary: {systemName}");
        summaryPayload.Content.Should().Contain("## Services");
        summaryPayload.Content.Should().Contain("rag-api");
        summaryPayload.Content.Should().Contain("rag-search");
        summaryPayload.Content.Should().Contain("## Required Controls");
        summaryPayload.Content.Should().Contain("Managed Identity");
    }
}
