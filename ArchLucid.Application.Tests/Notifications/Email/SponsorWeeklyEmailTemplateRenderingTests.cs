using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Notifications.Email.Models;
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
    }
}
