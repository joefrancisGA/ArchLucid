namespace ArchLucid.Core.Notifications.Email;

public interface IEmailProvider
{
    string ProviderName
    {
        get;
    }

    Task SendAsync(EmailMessage message, CancellationToken cancellationToken);
}
