using ArchLucid.Application.Alerts;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Alerts;

[Trait("Category", "Unit")]
public sealed class IntegrationDestinationRedactorTests
{
    [Fact]
    public void Redact_http_url_becomes_placeholder()
    {
        IntegrationDestinationRedactor.Redact("https://hooks.slack.com/services/abc/secret")
            .Should().Be("[webhook-url-redacted]");
    }

    [Fact]
    public void Redact_email_becomes_placeholder()
    {
        IntegrationDestinationRedactor.Redact("ops@contoso.com").Should().Be("[email-redacted]");
    }

    [Fact]
    public void Redact_other_non_secret_pattern_is_generic()
    {
        IntegrationDestinationRedactor.Redact("queue:alerts").Should().Be("[destination-redacted]");
    }
}
