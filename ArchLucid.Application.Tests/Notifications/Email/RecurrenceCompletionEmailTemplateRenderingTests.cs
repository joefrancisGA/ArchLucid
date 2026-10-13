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
}
