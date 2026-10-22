// stryker disable all
using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Tenancy;

namespace ArchLucid.Application.Identity;

public sealed partial class RegistrationApplicationService
{
    /// <inheritdoc />
    public async Task<RegistrationResult> RegisterAsync(
        TenantSelfRegistrationRequest? request,
        CancellationToken cancellationToken)
    {
        RegistrationResult? inviteOnly = TryRejectInviteOnly();

        if (inviteOnly is not null)
            return inviteOnly;

        RegistrationResult? invalidRequest = await TryRejectInvalidRequestAsync(request, cancellationToken);

        if (invalidRequest is not null)
            return invalidRequest;

        RegistrationBaselineValidation baseline = RegistrationRequestBaselineValidator.Validate(request!);

        RegistrationAbuseGateResult abuseGate = await EvaluateRegistrationAbuseGateAsync(
            request!,
            baseline,
            cancellationToken);

        if (abuseGate.Result is not null)
            return abuseGate.Result;

        if (await TryResolveExistingOrganizationAsync(request!.OrganizationName, cancellationToken).ConfigureAwait(false)
            is not null)
        {
            return await RegisterOrganizationConflictAsync(request, abuseGate.ActorEmail, cancellationToken)
                .ConfigureAwait(false);
        }

        try
        {
            return await PersistBootstrapRegistrationAsync(
                request,
                abuseGate.ActorEmail,
                abuseGate.NormalizedAdminEmail,
                abuseGate.Baseline,
                cancellationToken);
        }
        catch (Exception ex) when (ex is ArgumentException or InvalidOperationException)
        {
            return await MapRegisterValidationExceptionAsync(
                request,
                abuseGate.ActorEmail,
                ex,
                cancellationToken);
        }
        catch (Exception ex) when (TenantOrganizationDuplicateDetector.IsDuplicateOrganization(ex))
        {
            return await MapRegisterDuplicateOrganizationExceptionAsync(
                request,
                abuseGate.ActorEmail,
                cancellationToken);
        }
        catch (Exception ex)
        {
            return await MapRegisterInternalExceptionAsync(
                request,
                abuseGate.ActorEmail,
                ex,
                cancellationToken);
        }
    }

    private sealed record RegistrationAbuseGateResult(
        RegistrationResult? Result,
        string ActorEmail,
        string NormalizedAdminEmail,
        RegistrationBaselineValidation Baseline);
}
