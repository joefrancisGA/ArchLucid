namespace ArchLucid.Application.Identity;

/// <summary>
///     Application workflow for public tenant self-registration previously hosted in
///     <c>RegistrationController</c>.
/// </summary>
public interface IRegistrationApplicationService
{
    Task<RegistrationResult> RegisterAsync(
        TenantSelfRegistrationRequest? request,
        CancellationToken cancellationToken);
}
