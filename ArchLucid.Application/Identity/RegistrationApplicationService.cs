using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Tenancy;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Identity;

/// <summary>
///     Default <see cref="IRegistrationApplicationService"/> consolidating public registration orchestration
///     previously in <c>RegistrationController</c>.
/// </summary>
public sealed partial class RegistrationApplicationService(
    ITenantProvisioningService provisioning,
    ITenantRepository tenants,
    IAuditService audit,
    ITrialTenantBootstrapService trialBootstrap,
    ISelfServiceTrialAbusePolicy abusePolicy,
    IOptions<PublicSignupOptions> publicSignupOptions,
    TimeProvider timeProvider) : IRegistrationApplicationService
{
    private const string InviteOnlyMessage =
        "Registration is by invitation. Request access to join an evaluation workspace.";

    private const string FriendlyValidation =
        "The registration could not be completed. Check the organization name, email, and optional review-cycle fields, then try again.";

    private const string FriendlyInternal =
        "We could not complete your registration. Please try again in a few minutes. If the problem continues, share the correlationId field on this error response (or the X-Correlation-ID response header) with your administrator.";

    private const string DuplicateOrganizationMessage =
        "An organization with this name is already registered.";

    private readonly IAuditService _audit = audit ?? throw new ArgumentNullException(nameof(audit));

    private readonly ITenantProvisioningService _provisioning =
        provisioning ?? throw new ArgumentNullException(nameof(provisioning));

    private readonly ITenantRepository _tenants =
        tenants ?? throw new ArgumentNullException(nameof(tenants));

    private readonly ITrialTenantBootstrapService _trialBootstrap =
        trialBootstrap ?? throw new ArgumentNullException(nameof(trialBootstrap));

    private readonly ISelfServiceTrialAbusePolicy _abusePolicy =
        abusePolicy ?? throw new ArgumentNullException(nameof(abusePolicy));

    private readonly PublicSignupOptions _publicSignupOptions =
        publicSignupOptions?.Value ?? throw new ArgumentNullException(nameof(publicSignupOptions));

    private readonly TimeProvider _timeProvider = timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));
}
