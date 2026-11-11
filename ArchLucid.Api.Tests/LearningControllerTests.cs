using System.Net;
using System.Text.Json;

using ArchLucid.Api.Models.Learning;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Contracts.ProductLearning.Planning;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>Integration tests for <c>/v1/learning/*</c> (59R planning read model).</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
[Trait("ChangeSet", "59R")]
public sealed class LearningControllerTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task GetThemes_Default_ReturnsOk_WithEmptyThemes()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/learning/themes");

        LearningThemesListResponse body =
            await response.ReadJsonForTestAsync<LearningThemesListResponse>(JsonOptions);

        body.Themes.Should().NotBeNull();
        body.Themes.Should().BeEmpty();
    }

    [SkippableFact]
    public async Task GetThemes_InvalidMax_Returns400Problem()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/learning/themes?maxThemes=0");

        await response.AssertProblemForTestAsync(
            HttpStatusCode.BadRequest,
            ProblemTypes.ValidationFailed,
            detailContains: "maxThemes");
    }

    [SkippableFact]
    public async Task GetPlans_Default_ReturnsOk_WithEmptyPlans()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/learning/plans");

        LearningPlansListResponse body =
            await response.ReadJsonForTestAsync<LearningPlansListResponse>(JsonOptions);

        body.Plans.Should().NotBeNull();
        body.Plans.Should().BeEmpty();
    }

    [SkippableFact]
    public async Task GetPlanById_InvalidGuid_Returns400Problem()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/learning/plans/not-a-guid");

        await response.AssertProblemForTestAsync(HttpStatusCode.BadRequest, ProblemTypes.ValidationFailed);
    }

    [SkippableFact]
    public async Task GetPlanById_UnknownGuid_Returns404Problem()
    {
        HttpResponseMessage response =
            await Client.GetAsync("/v1/learning/plans/00000000-0000-0000-0000-000000000001");

        await response.AssertProblemForTestAsync(
            HttpStatusCode.NotFound,
            ProblemTypes.LearningImprovementPlanNotFound);
    }

    [SkippableFact]
    public async Task GetSummary_Default_ReturnsOk_WithZeroCounts()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/learning/summary");

        LearningSummaryResponse body = await response.ReadJsonForTestAsync<LearningSummaryResponse>(JsonOptions);

        body.ThemeCount.Should().Be(0);
        body.PlanCount.Should().Be(0);
        body.TotalThemeEvidenceSignals.Should().Be(0);
        body.TotalLinkedSignalsAcrossPlans.Should().Be(0);
        body.MaxPlanPriorityScore.Should().BeNull();
    }

    [SkippableFact]
    public async Task GetListBundle_Default_ReturnsOk_WithEmptyCollections()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/learning/list-bundle");

        LearningPlanningListBundleResponse body =
            await response.ReadJsonForTestAsync<LearningPlanningListBundleResponse>(JsonOptions);

        body.Summary.ThemeCount.Should().Be(0);
        body.Summary.PlanCount.Should().Be(0);
        body.Themes.Themes.Should().BeEmpty();
        body.Plans.Plans.Should().BeEmpty();
    }

    [SkippableFact]
    public async Task GetListBundle_InvalidMaxThemes_Returns400Problem()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/learning/list-bundle?maxThemes=0");

        await response.AssertProblemForTestAsync(
            HttpStatusCode.BadRequest,
            ProblemTypes.ValidationFailed,
            detailContains: "maxThemes");
    }

    [SkippableFact]
    public async Task GetSummary_InvalidMaxPlans_Returns400Problem()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/learning/summary?maxPlans=abc");

        await response.AssertProblemForTestAsync(
            HttpStatusCode.BadRequest,
            detailContains: "maxPlans");
    }

    [SkippableFact]
    public async Task GetSummary_InvalidMaxThemes_Returns400Problem()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/learning/summary?maxThemes=0");

        await response.AssertProblemForTestAsync(
            HttpStatusCode.BadRequest,
            ProblemTypes.ValidationFailed,
            detailContains: "maxThemes");
    }

    [SkippableFact]
    public async Task GetPlans_InvalidMaxPlans_Returns400Problem()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/learning/plans?maxPlans=-1");

        await response.AssertProblemForTestAsync(
            HttpStatusCode.BadRequest,
            ProblemTypes.ValidationFailed,
            detailContains: "maxPlans");
    }

    [SkippableFact]
    public async Task GetPlanningReport_Json_ReturnsOk_WithDocumentShape()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/learning/report?format=json");

        LearningPlanningReportDocument doc =
            await response.ReadJsonForTestAsync<LearningPlanningReportDocument>(JsonOptions);

        doc.Summary.ThemeCount.Should().Be(0);
        doc.Themes.Should().BeEmpty();
        doc.Plans.Should().BeEmpty();
    }

    [SkippableFact]
    public async Task GetPlanningReport_Markdown_ReturnsOk_WithWrapper()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/learning/report?format=markdown");

        LearningPlanningReportExportResponse body =
            await response.ReadJsonForTestAsync<LearningPlanningReportExportResponse>(JsonOptions);

        body.Format.Should().Be("markdown");
        body.FileName.Should().Be("learning-planning-report-59r.md");
        body.Content.Should().NotBeNullOrWhiteSpace();
        body.Content.Split('\n', StringSplitOptions.RemoveEmptyEntries)[0].Should().StartWith("# ");
    }

    [SkippableFact]
    public async Task GetPlanningReport_InvalidFormat_Returns400Problem()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/learning/report?format=xml");

        await response.AssertProblemForTestAsync(HttpStatusCode.BadRequest, ProblemTypes.ValidationFailed);
    }

    [SkippableFact]
    public async Task DownloadPlanningReport_File_Markdown_ReturnsMarkdownContentType()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/learning/report/file?format=markdown");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType!.MediaType.Should().Be("text/markdown");

        string text = await response.Content.ReadAsStringAsync();
        text.Split('\n', StringSplitOptions.RemoveEmptyEntries)[0].Should().StartWith("# ");
    }

    [SkippableFact]
    public async Task DownloadPlanningReport_File_Json_IsIndentedObject()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/learning/report/file?format=json");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType!.MediaType.Should().Be("application/json");

        string text = await response.Content.ReadAsStringAsync();
        using JsonDocument doc = JsonDocument.Parse(text);
        doc.RootElement.GetProperty("summary").GetProperty("themeCount").GetInt32().Should().Be(0);
    }

    [SkippableFact]
    public async Task DownloadPlanningReport_File_InvalidFormat_Returns400Problem()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/learning/report/file?format=yaml");

        await response.AssertProblemForTestAsync(HttpStatusCode.BadRequest, ProblemTypes.ValidationFailed);
    }

    [SkippableFact]
    public async Task GetPlanningReport_Json_empty_scope_exposes_expected_arrays_and_counts()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/learning/report?format=json");

        response.StatusCode.Should().Be(HttpStatusCode.OK);

        string text = await response.Content.ReadAsStringAsync();
        using JsonDocument doc = JsonDocument.Parse(text);

        doc.RootElement.GetProperty("summary").GetProperty("planCount").GetInt32().Should().Be(0);
        doc.RootElement.GetProperty("themes").GetArrayLength().Should().Be(0);
        doc.RootElement.GetProperty("plans").GetArrayLength().Should().Be(0);
        doc.RootElement.TryGetProperty("generatedUtc", out JsonElement _).Should().BeTrue();
    }

    [SkippableFact]
    public async Task GetPlanningReport_InvalidMaxReportSignalLinks_Returns400Problem()
    {
        HttpResponseMessage response =
            await Client.GetAsync("/v1/learning/report?format=json&maxReportSignalLinks=0");

        await response.AssertProblemForTestAsync(
            HttpStatusCode.BadRequest,
            detailContains: "maxReportSignalLinks");
    }
}
