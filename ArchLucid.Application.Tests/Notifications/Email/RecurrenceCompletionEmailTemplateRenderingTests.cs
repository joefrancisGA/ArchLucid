using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Notifications.Email.Models;
using ArchLucid.Notifications.Email.RazorLight;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Notifications.Email;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RecurrenceCompletionEmailTemplateRenderingTests
{
    private readonly RazorLightEmailTemplateRenderer _renderer = new();

    [SkippableFact]
    public async Task RecurrenceCompletion_html_encodes_schedule_name_metacharacters()
    {
        const string maliciousScheduleName = "<img src=x onerror=alert(1)>";

        string html = await _renderer.RenderHtmlAsync(
            RecurrenceCompletionEmailDispatcher.TemplateId,
            new RecurrenceCompletionEmailModel
            {
                ProductName = "ArchLucid",
                ScheduleName = maliciousScheduleName,
                NewFindingCount = 1,
                ResolvedFindingCount = 0,
                RunDetailUrl = "https://app.example/reviews/abc",
                CompareUrl = "https://app.example/compare",
            },
            CancellationToken.None);

        html.Should().Contain("&lt;img");
        html.Should().NotContain("<img src=x");
    }

    [SkippableFact]
    public async Task RecurrenceCompletion_html_encodes_href_urls_with_quotes_in_attribute()
    {
        const string quotedUrl = "https://app.example/reviews/abc?x=%22injected%22";

        string html = await _renderer.RenderHtmlAsync(
            RecurrenceCompletionEmailDispatcher.TemplateId,
            new RecurrenceCompletionEmailModel
            {
                ProductName = "ArchLucid",
                ScheduleName = "Weekly scan",
                NewFindingCount = 0,
                ResolvedFindingCount = 0,
                RunDetailUrl = quotedUrl,
                CompareUrl = "https://app.example/compare",
            },
            CancellationToken.None);

        html.Should().Contain(quotedUrl);
        html.Should().NotContain("href=\"https://app.example/reviews/abc?x=\"");
    }

    [SkippableFact]
    public async Task RecurrenceCompletion_text_part_strips_html_without_emitting_href_urls()
    {
        const string runDetailUrl = "https://app.example/reviews/abc";
        const string compareUrl = "https://app.example/compare";

        string text = await _renderer.RenderTextAsync(
            RecurrenceCompletionEmailDispatcher.TemplateId,
            new RecurrenceCompletionEmailModel
            {
                ProductName = "ArchLucid",
                ScheduleName = "Weekly scan",
                NewFindingCount = 0,
                ResolvedFindingCount = 0,
                RunDetailUrl = runDetailUrl,
                CompareUrl = compareUrl,
            },
            CancellationToken.None);

        text.Should().Contain("Open the review");
        text.Should().Contain("View finding lifecycle across reviews");
        text.Should().NotContain(runDetailUrl);
        text.Should().NotContain(compareUrl);
    }
}
