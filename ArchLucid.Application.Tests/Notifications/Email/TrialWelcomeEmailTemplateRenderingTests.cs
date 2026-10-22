using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Notifications.Email.Models;
using ArchLucid.Notifications.Email.RazorLight;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Notifications.Email;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TrialWelcomeEmailTemplateRenderingTests
{
    private readonly RazorLightEmailTemplateRenderer _renderer = new();

    [SkippableFact]
    public async Task TrialWelcome_html_encodes_organization_hint_metacharacters()
    {
        const string maliciousHint = "<script>alert('tenant')</script>";

        string html = await _renderer.RenderHtmlAsync(
            EmailTemplateIds.TrialWelcome,
            new TrialWelcomeEmailModel(maliciousHint, "ArchLucid"),
            CancellationToken.None);

        html.Should().Contain("&lt;script&gt;");
        html.Should().NotContain("<script>alert");
    }
}
