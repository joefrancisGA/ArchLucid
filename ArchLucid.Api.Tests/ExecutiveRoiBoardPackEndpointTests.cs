using System.Net;
using System.Text;

using ArchLucid.Api.Routing;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

/// <summary>HTTP coverage for executive ROI board-pack export.</summary>
[Trait("Category", "Integration")]
[Trait("Suite", "Core")]
public sealed class ExecutiveRoiBoardPackEndpointTests(ArchLucidApiFactory factory) : IntegrationTestBase(factory)
{
    [SkippableFact]
    public async Task GetBoardPack_default_format_returns_markdown()
    {
        HttpResponseMessage response = await Client.GetAsync($"/{ApiV1Routes.RoiExecutiveSummaryBoardPack}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("text/markdown");

        string body = await response.Content.ReadAsStringAsync();
        body.Should().Contain("# Executive ROI — Board Pack");
        body.Should().Contain("Estimated savings");
    }

    [SkippableFact]
    public async Task GetBoardPack_pdf_returns_pdf_bytes()
    {
        HttpResponseMessage response = await Client.GetAsync($"/{ApiV1Routes.RoiExecutiveSummaryBoardPack}?format=pdf");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        response.Content.Headers.ContentType?.MediaType.Should().Be("application/pdf");

        byte[] bytes = await response.Content.ReadAsByteArrayAsync();
        bytes.Length.Should().BeGreaterThan(100);
        Encoding.ASCII.GetString(bytes.AsSpan(0, 4)).Should().Be("%PDF");
    }

    [SkippableFact]
    public async Task GetBoardPack_markdown_excludes_demo_derived_labels_tb299()
    {
        HttpResponseMessage response = await Client.GetAsync($"/{ApiV1Routes.RoiExecutiveSummaryBoardPack}");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        string body = await response.Content.ReadAsStringAsync();

        body.Should().Contain("# Executive ROI — Board Pack");
        body.Should().NotContain("demo run", because: "board pack must not surface demo-derived run labels");
        body.Should().NotContain("Simulator-only", because: "board pack must not surface simulator-only marketing labels");
    }

    [SkippableFact]
    public async Task GetExecutiveSummary_includes_orphan_and_freshness_contract_fields_tb299()
    {
        HttpResponseMessage response = await Client.GetAsync("/v1/roi/executive-summary");

        response.StatusCode.Should().Be(HttpStatusCode.OK);
        string json = await response.Content.ReadAsStringAsync();

        json.Should().Contain("orphanCandidates", because: "executive summary must expose orphan KPI contract for board-pack lineage");
        json.Should().Contain("costEvidenceFreshnessStatus", because: "executive summary must expose freshness labeling consumed by board pack");
    }
}
