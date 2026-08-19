namespace ArchLucid.Application.Identity;

/// <summary>Decides whether self-service trial bootstrap may run for a registered admin email.</summary>
public interface ITrialBootstrapEmailVerificationPolicy
{
    Task<bool> CanProvisionTrialForRegisteredEmailAsync(string adminEmail, CancellationToken cancellationToken);
}
