using ArchLucid.Core.Configuration;
using ArchLucid.Core.Notifications.Email;

namespace ArchLucid.Persistence.Notifications.Email;

public sealed class NoopEmailProvider : IEmailProvider
{
    /// <inheritdoc />
    public string ProviderName => EmailProviderNames.Noop;

    /// <inheritdoc />
    public Task SendAsync(EmailMessage message, CancellationToken cancellationToken)
    {
        _ = message;
        _ = cancellationToken;

        return Task.CompletedTask;
    }
}
