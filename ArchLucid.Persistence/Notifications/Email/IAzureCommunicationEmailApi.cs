namespace ArchLucid.Persistence.Notifications.Email;

/// <summary>Thin transport for Azure Communication Services Email so unit tests can stub network calls.</summary>
public interface IAzureCommunicationEmailApi
{
    Task<string> SendAsync(
        string endpoint,
        string? managedIdentityClientId,
        string fromAddress,
        string toAddress,
        string subject,
        string? plainText,
        string html,
        CancellationToken cancellationToken);
}
