using System.Net;

using ArchLucid.Contracts.ProductLearning;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>Integration tests for <c>/v1/product-learning/*</c> (scoped read model; empty data is valid).</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
[Trait("ChangeSet", "58R")]
public sealed class ProductLearningControllerTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task GetSummary_ReturnsOk_WithCountsAndNotes()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/product-learning/summary");

        ProductLearningDashboardSummaryResponse? body =
            await response.ReadJsonForTestAsync<ProductLearningDashboardSummaryResponse>(JsonOptions);

        body.SummaryNotes.Should().NotBeEmpty();
        body.TotalSignalsInScope.Should().Be(0);
        body.TopAggregateCount.Should().Be(0);
    }

    [SkippableFact]
    public async Task GetDashboard_ReturnsOk_WithAllSlices()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/product-learning/dashboard");

        ProductLearningDashboardBundleResponse? body =
            await response.ReadJsonForTestAsync<ProductLearningDashboardBundleResponse>(JsonOptions);

        body!.Summary.SummaryNotes.Should().NotBeEmpty();
        body.Summary.TotalSignalsInScope.Should().Be(0);
        body.Opportunities.Opportunities.Should().NotBeNull();
        body.Trends.Trends.Should().NotBeNull();
        body.Triage.Items.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task GetSummary_InvalidSince_Returns400Problem()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/product-learning/summary?since=not-a-date");

        await response.AssertProblemForTestAsync(
            HttpStatusCode.BadRequest,
            ProblemTypes.ValidationFailed,
            detailContains: "since");
    }

    [SkippableFact]
    public async Task GetImprovementOpportunities_InvalidMax_Returns400Problem()
    {
        HttpResponseMessage response =
            await Client.GetAsync("/v1/product-learning/improvement-opportunities?maxOpportunities=999");

        await response.AssertProblemForTestAsync(
            HttpStatusCode.BadRequest,
            ProblemTypes.ValidationFailed,
            detailContains: "maxOpportunities");
    }

    [SkippableFact]
    public async Task GetArtifactOutcomeTrends_ValidSince_ReturnsOk()
    {
        HttpResponseMessage response =
            await Client.GetAsync("/v1/product-learning/artifact-outcome-trends?since=2024-01-01T00:00:00Z");

        ProductLearningArtifactOutcomeTrendsResponse? body =
            await response.ReadJsonForTestAsync<ProductLearningArtifactOutcomeTrendsResponse>(JsonOptions);

        body.Trends.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task GetTriageQueue_Default_ReturnsOk()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/product-learning/triage-queue");

        ProductLearningTriageQueueResponse? body =
            await response.ReadJsonForTestAsync<ProductLearningTriageQueueResponse>(JsonOptions);

        body.Items.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task GetReport_FormatJson_ReturnsStructuredDocument()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/product-learning/report?format=json");

        ProductLearningTriageReportDocument? doc =
            await response.ReadJsonForTestAsync<ProductLearningTriageReportDocument>(JsonOptions);

        doc.ArtifactOutcomes.Should().NotBeNull();
        doc.TopProblemAreas.Should().NotBeNull();
        doc.TopImprovements.Should().NotBeNull();
        doc.TriageQueuePreview.Should().NotBeNull();
    }

    [SkippableFact]
    public async Task GetReport_FormatMarkdown_ReturnsExportWrapper()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/product-learning/report?format=markdown");

        ProductLearningReportExportResponse? body =
            await response.ReadJsonForTestAsync<ProductLearningReportExportResponse>(JsonOptions);

        body.Format.Should().Be("markdown");
        body.Content.Should().Contain("Pilot feedback");
        body.FileName.Should().EndWith(".md");
    }

    [SkippableFact]
    public async Task GetReport_InvalidFormat_Returns400()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/product-learning/report?format=xml");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task GetReportFile_Markdown_ReturnsMarkdownContentType()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/product-learning/report/file?format=markdown");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("text/markdown");
        string text = await response.Content.ReadAsStringAsync();
        text.Should().Contain("# Pilot feedback");
    }

    [SkippableFact]
    public async Task GetImprovementOpportunities_MaxOpportunities_respects_upper_bound_contract()
    {
        HttpResponseMessage response =
            await Client.GetAsync("/v1/product-learning/improvement-opportunities?maxOpportunities=1");

        ProductLearningImprovementOpportunitiesResponse? body =
            await response.ReadJsonForTestAsync<ProductLearningImprovementOpportunitiesResponse>(JsonOptions);

        body.Opportunities.Count.Should().BeLessThanOrEqualTo(1);
    }

    [SkippableFact]
    public async Task GetReport_InvalidMaxReportArtifacts_Returns400()
    {
        HttpResponseMessage response =
            await Client.GetAsync("/v1/product-learning/report?format=json&maxReportArtifacts=99");

        response.StatusCode.Should().Be(HttpStatusCode.BadRequest);
    }

    [SkippableFact]
    public async Task GetArtifactOutcomeTrends_InvalidSince_Returns400Problem()
    {
        HttpResponseMessage response =
            await Client.GetAsync("/v1/product-learning/artifact-outcome-trends?since=not-a-date");

        await response.AssertProblemForTestAsync(
            HttpStatusCode.BadRequest,
            ProblemTypes.ValidationFailed,
            detailContains: "since");
    }

    [SkippableFact]
    public async Task GetTriageQueue_InvalidMaxTriageItems_Returns400Problem()
    {
        HttpResponseMessage response =
            await Client.GetAsync("/v1/product-learning/triage-queue?maxTriageItems=0");

        await response.AssertProblemForTestAsync(HttpStatusCode.BadRequest, ProblemTypes.ValidationFailed);
    }

    [SkippableFact]
    public async Task DownloadTriageReport_File_Json_ReturnsJsonContentType()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/product-learning/report/file?format=json");

        response.Content.Headers.ContentType!.MediaType.Should().Be("application/json");

        ProductLearningTriageReportDocument doc =
            await response.ReadJsonForTestAsync<ProductLearningTriageReportDocument>(JsonOptions);

        doc.TotalSignalsInScope.Should().Be(0);
        doc.GeneratedUtc.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromMinutes(5));
    }
}
