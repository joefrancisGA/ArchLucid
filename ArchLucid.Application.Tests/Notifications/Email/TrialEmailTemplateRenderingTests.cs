using ArchLucid.Application.Notifications.Email;
using ArchLucid.Application.Notifications.Email.Models;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Notifications.Email;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class TrialEmailTemplateRenderingTests
{
    private readonly RazorLightEmailTemplateRenderer _renderer = new();

    [Fact]
    public async Task TrialWelcome_renders_valid_html()
    {
        string html = await _renderer.RenderHtmlAsync(
            EmailTemplateIds.TrialWelcome,
            new TrialWelcomeEmailModel("Contoso", "ArchLucid"),
            CancellationToken.None);

        html.Should().Contain("<!DOCTYPE html>");
        html.Should().Contain("Welcome to ArchLucid");
        html.Should().Contain("Contoso");
    }

    [Fact]
    public async Task TrialFirstRunComplete_renders_valid_html()
    {
        string html = await _renderer.RenderHtmlAsync(
            EmailTemplateIds.TrialFirstRunComplete,
            new TrialFirstRunEmailModel("ArchLucid", "https://app.example/welcome"),
            CancellationToken.None);

        html.Should().Contain("architecture run completed");
        html.Should().Contain("https://app.example/welcome");
    }

    [Fact]
    public async Task TrialMidTrialDay7_renders_valid_html()
    {
        string html = await _renderer.RenderHtmlAsync(
            EmailTemplateIds.TrialMidTrialDay7,
            new TrialMidTrialEmailModel("ArchLucid", "https://app.example/"),
            CancellationToken.None);

        html.Should().Contain("Mid-trial");
        html.Should().Contain("https://app.example/");
    }

    [Fact]
    public async Task TrialApproachingRunLimit_renders_valid_html()
    {
        string html = await _renderer.RenderHtmlAsync(
            EmailTemplateIds.TrialApproachingRunLimit,
            new TrialApproachingRunLimitEmailModel("ArchLucid", 8, 10),
            CancellationToken.None);

        html.Should().Contain("8");
        html.Should().Contain("10");
    }

    [Fact]
    public async Task TrialExpiringSoon_renders_valid_html()
    {
        string html = await _renderer.RenderHtmlAsync(
            EmailTemplateIds.TrialExpiringSoon,
            new TrialExpiringSoonEmailModel("ArchLucid", 2),
            CancellationToken.None);

        html.Should().Contain("2");
    }

    [Fact]
    public async Task TrialExpired_renders_valid_html()
    {
        string html = await _renderer.RenderHtmlAsync(
            EmailTemplateIds.TrialExpired,
            new TrialExpiredEmailModel("ArchLucid", "https://app.example/welcome"),
            CancellationToken.None);

        html.Should().Contain("ended");
        html.Should().Contain("https://app.example/welcome");
    }

    [Fact]
    public async Task TrialConverted_renders_valid_html()
    {
        string html = await _renderer.RenderHtmlAsync(
            EmailTemplateIds.TrialConverted,
            new TrialConvertedEmailModel("ArchLucid", "Professional"),
            CancellationToken.None);

        html.Should().Contain("paid Professional");
    }

    [Fact]
    public void TemplateKey_matches_embedded_resource_naming()
    {
        string key = RazorLightEmailTemplateRenderer.TemplateKey(EmailTemplateIds.TrialWelcome);

        key.Should().Be("Templates.TrialWelcome.cshtml");
    }
}
