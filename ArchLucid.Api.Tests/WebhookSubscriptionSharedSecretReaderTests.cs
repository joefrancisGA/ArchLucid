using ArchLucid.Api.Services;

using FluentAssertions;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
public sealed class WebhookSubscriptionSharedSecretReaderTests
{
    [Fact]
    public void TryRead_returns_webhookSharedSecret_when_present()
    {
        string json = """{"webhookSharedSecret":"super-secret-key-12345","eventTypes":[]}""";

        WebhookSubscriptionSharedSecretReader.TryRead(json).Should().Be("super-secret-key-12345");
    }

    [Fact]
    public void TryRead_returns_null_when_metadata_empty()
    {
        WebhookSubscriptionSharedSecretReader.TryRead(null).Should().BeNull();
        WebhookSubscriptionSharedSecretReader.TryRead("{}").Should().BeNull();
    }
}
