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
        FinalizedRun finalized = await ArrangeFinalizedAsync();

        ManifestMarkdownDocumentResponse summaryPayload =
            await finalized.GetManifestSummaryAsync(Client, JsonOptions);
        summaryPayload.Should().NotBeNull();
        summaryPayload.Format.Should().Be("markdown");
        summaryPayload.Content.Should().Contain($"# Architecture Summary: {finalized.SystemName}");
        summaryPayload.Content.Should().Contain("## Services");
        summaryPayload.Content.Should().Contain("rag-api");
        summaryPayload.Content.Should().Contain("rag-search");
        summaryPayload.Content.Should().Contain("## Required Controls");
        summaryPayload.Content.Should().Contain("Managed Identity");
    }
}
