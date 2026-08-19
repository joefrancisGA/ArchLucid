using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications.Email;
using ArchLucid.Persistence.Notifications.Email;

namespace ArchLucid.Persistence.Tests.Notifications;

[Trait("Category", "Unit")]
public sealed class NoopEmailProviderTests
{
    [Fact]
    public void ProviderName_is_noop()
    {
        NoopEmailProvider sut = new();

        sut.ProviderName.Should().Be(EmailProviderNames.Noop);
    }

    [Fact]
    public async Task SendAsync_completes_without_sending()
    {
        NoopEmailProvider sut = new();
        EmailMessage message = new()
        {
            To = "ops@example.com",
            Subject = "test",
            HtmlBody = "<p>hi</p>",
            IdempotencyKey = "idem-1",
        };

        Func<Task> act = async () => await sut.SendAsync(message, CancellationToken.None);

        await act.Should().NotThrowAsync();
    }
}
