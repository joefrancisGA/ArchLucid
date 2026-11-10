using ArchLucid.Api.Models;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Tests for Architecture Summary Evidence.
/// </summary>
[Trait("Category", "Integration")]
public sealed class ArchitectureSummaryEvidenceTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task GetManifestSummary_IncludesEvidenceContext()
    {
        FinalizedRun finalized = await CreateFinalizedRunAsync("REQ-SUMMARY-EVIDENCE-001");

        // Evidence is appended on the dedicated endpoint; the default markdown summary is options-driven and evidence-agnostic.
        ManifestMarkdownDocumentResponse summaryPayload = await (
            await Client.GetAsync(
                $"/v1/architecture/manifest/{Uri.EscapeDataString(finalized.ManifestVersion)}/summary/evidence"))
            .ReadJsonForTestAsync<ManifestMarkdownDocumentResponse>(JsonOptions);
        summaryPayload.Summary.Should().Contain("## Evidence Context");
        summaryPayload.Summary.Should().Contain("### Policy Evidence");
        summaryPayload.Summary.Should().Contain("### Service Catalog Hints");
        summaryPayload.Summary.Should().Contain("Managed Identity");
        summaryPayload.Summary.Should().Contain("Azure AI Search");
    }
}
