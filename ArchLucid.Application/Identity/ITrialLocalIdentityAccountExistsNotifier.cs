namespace ArchLucid.Application.Identity;

/// <summary>
///     Sends a generic notice when trial local registration targets an email that already has an account (anti-enumeration).
/// </summary>
public interface ITrialLocalIdentityAccountExistsNotifier
{
    Task NotifyAccountAlreadyExistsAsync(string toEmail, CancellationToken cancellationToken);
}
