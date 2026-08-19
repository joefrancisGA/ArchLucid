using ArchLucid.Application.Notifications.Email;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Notifications.Email;

[Trait("Category", "Unit")]
public sealed class ExecDigestSponsorDeepLinkOperatorLinksTests
{
    private const string Token = "signed-token";
    private const string RunIdHex = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

    [Fact]
    public void BuildDashboardUrl_uses_tokenized_digest_sponsor_route()
    {
        string url = ExecDigestSponsorDeepLinkOperatorLinks.BuildDashboardUrl("https://app.example.com", Token);

        url.Should().Be("https://app.example.com/digest/sponsor?token=signed-token");
    }

    [Fact]
    public void BuildRunCollateralUrl_uses_tokenized_run_route()
    {
        string url = ExecDigestSponsorDeepLinkOperatorLinks.BuildRunCollateralUrl(
            "https://app.example.com",
            RunIdHex,
            Token);

        url.Should().Be(
            $"https://app.example.com/digest/sponsor/run/{RunIdHex}?token=signed-token");
    }
}
