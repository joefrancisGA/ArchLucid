using ArchLucid.Host.Core.Services.Delivery;

using ArchLucid.Notifications;

using FluentAssertions;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Host.Core.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class FakeDeliveryFakesTests
{
    [Fact]
    public async Task FakeEmailSender_SendAsync_completes()
    {
        FakeEmailSender sut = new(NullLogger<FakeEmailSender>.Instance);

        Func<Task> act = async () =>
            await sut.SendAsync("a@b.com", "hi", "body", CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task FakeWebhookPoster_PostJsonAsync_logs_with_and_without_hmac()
    {
        ILogger<FakeWebhookPoster> logger = NullLogger<FakeWebhookPoster>.Instance;
        FakeWebhookPoster sut = new(logger);

        await sut.PostJsonAsync(
            "https://example.test/hook",
            new { x = 1 },
            CancellationToken.None);

        await sut.PostJsonAsync(
            "https://example.test/hook",
            new { x = 2 },
            CancellationToken.None,
            new WebhookPostOptions { HmacSha256SharedSecret = "secret" });
    }
}
