using ArchLucid.Application.ExecDigest;
using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Notifications.Email.Models;
using ArchLucid.Application.Exports;
using ArchLucid.Notifications.Email.RazorLight;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Notifications.Email;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class SponsorWeeklyEmailTemplateRenderingTests
{
    private readonly RazorLightEmailTemplateRenderer _renderer = new();

    [SkippableFact]
    public async Task WeeklySponsorSummary_renders_valid_html()
    {
        string html = await _renderer.RenderHtmlAsync(
            WeeklySponsorSummaryEmailDispatcher.TemplateId,
            new WeeklySponsorSummaryEmailModel
            {
                ProductName = "ArchLucid",
                WeekLabel = "2026-W12",
                RunIdHex = "a1b2c3d4",
                RunDetailUrl = "https://app.example/architecture/reviews/a1b2c3d4",
                SummaryMarkdown = "Sponsor summary body",
            },
            CancellationToken.None);

        html.Should().Contain("<!DOCTYPE html>");
        html.Should().Contain("Weekly sponsor summary");
        html.Should().Contain("Sponsor summary body");
        html.Should().Contain("https://app.example/architecture/reviews/a1b2c3d4");
        html.Should().Contain("Sponsor ROI honesty:");
        html.Should().Contain(SendableExportCoverComposer.SponsorRoiNonSummingHeadlineLine);
        html.Should().Contain("Policy influence:");
        html.Should().Contain(SendableExportCoverComposer.PolicyPackInfluenceHonestyLine);
    }

    [SkippableFact]
    public async Task WeeklySponsorReport_renders_valid_html()
    {
        string html = await _renderer.RenderHtmlAsync(
            WeeklySponsorReportEmailDispatcher.TemplateId,
            new WeeklySponsorReportEmailModel
            {
                ProductName = "ArchLucid",
                WeekLabel = "2026-W12",
                RunIdHex = "e5f6a7b8",
                RunDetailUrl = "https://app.example/architecture/reviews/e5f6a7b8",
                SummaryMarkdown = "Sponsor report body",
            },
            CancellationToken.None);

        html.Should().Contain("<!DOCTYPE html>");
        html.Should().Contain("Weekly sponsor report");
        html.Should().Contain("Sponsor report body");
        html.Should().Contain("https://app.example/architecture/reviews/e5f6a7b8");
        html.Should().Contain("Sponsor ROI honesty:");
        html.Should().Contain(SendableExportCoverComposer.SponsorRoiNonSummingHeadlineLine);
        html.Should().Contain("Policy influence:");
        html.Should().Contain(SendableExportCoverComposer.PolicyPackInfluenceHonestyLine);
    }

    [SkippableFact]
    public async Task WeeklySponsorReport_html_encodes_summary_markdown_in_preformatted_block()
    {
        const string maliciousMarkdown = "</pre><img src=x onerror=alert(1)>";

        string html = await _renderer.RenderHtmlAsync(
            WeeklySponsorReportEmailDispatcher.TemplateId,
            new WeeklySponsorReportEmailModel
            {
                ProductName = "ArchLucid",
                WeekLabel = "2026-W12",
                RunIdHex = "e5f6a7b8",
                RunDetailUrl = "https://app.example/architecture/reviews/e5f6a7b8",
                SummaryMarkdown = maliciousMarkdown,
            },
            CancellationToken.None);

        html.Should().Contain("&lt;/pre&gt;&lt;img src=x onerror=alert(1)&gt;");
        html.Should().NotContain("</pre><img src=x onerror=alert(1)>");
    }

    [SkippableFact]
    public async Task WeeklySponsorReport_text_part_strips_html_tags_from_rendered_body()
    {
        const string summary = "Line one\nLine two";

        string text = await _renderer.RenderTextAsync(
            WeeklySponsorReportEmailDispatcher.TemplateId,
            new WeeklySponsorReportEmailModel
            {
                ProductName = "ArchLucid",
                WeekLabel = "2026-W12",
                RunIdHex = "e5f6a7b8",
                RunDetailUrl = "https://app.example/architecture/reviews/e5f6a7b8",
                SummaryMarkdown = summary,
            },
            CancellationToken.None);

        text.Should().Contain("Line one");
        text.Should().Contain("Line two");
        text.Should().NotContain("<pre");
        text.Should().NotContain("<p>");
    }

    [SkippableFact]
    public async Task ExecDigest_renders_decision_needed_markdown_in_preformatted_block()
    {
        const string decisionMarkdown = "### Approvals pending\n- item one";

        string html = await _renderer.RenderHtmlAsync(
            ExecDigestEmailDispatcher.TemplateId,
            new ExecDigestEmailModel
            {
                ProductName = "ArchLucid",
                WeekLabel = "2026-W12",
                DashboardUrl = "https://app.example/runs",
                SponsorValueReportUrl = "https://app.example/sponsor",
                UnsubscribeUrl = "https://app.example/unsub",
                DecisionNeededMarkdown = decisionMarkdown,
            },
            CancellationToken.None);

        html.Should().Contain("Decisions needed:");
        html.Should().Contain("### Approvals pending");
        html.Should().Contain("item one");
        html.Should().NotContain("<h3>Approvals pending</h3>");
    }

    [SkippableFact]
    public async Task ExecDigest_text_part_includes_decision_needed_markdown_after_tag_strip()
    {
        const string decisionMarkdown = "### Approvals pending\n- item one";

        string text = await _renderer.RenderTextAsync(
            ExecDigestEmailDispatcher.TemplateId,
            new ExecDigestEmailModel
            {
                ProductName = "ArchLucid",
                WeekLabel = "2026-W12",
                DashboardUrl = "https://app.example/runs",
                SponsorValueReportUrl = "https://app.example/sponsor",
                UnsubscribeUrl = "https://app.example/unsub",
                DecisionNeededMarkdown = decisionMarkdown,
            },
            CancellationToken.None);

        text.Should().Contain("Decisions needed:");
        text.Should().Contain("Approvals pending");
        text.Should().Contain("item one");
    }
}
