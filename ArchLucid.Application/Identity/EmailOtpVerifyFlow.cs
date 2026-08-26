using ArchLucid.Core.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Identity;

/// <summary>
///     Handles email OTP verification: code validation, identity linking, invitation acceptance, and next-step routing.
/// </summary>
public sealed partial class EmailOtpVerifyFlow(
    EmailOtpAuthOptions options,
    IEmailOtpChallengeRepository challenges,
    IEmailOtpSignInDomainPolicyService domainPolicy,
    IPlatformIdentityService platformIdentity,
    IAuthenticationIdentityRepository authenticationIdentities,
    IWorkspaceMembershipRepository memberships,
    IUserInvitationRepository invitations,
    IAuditService auditService,
    TimeProvider timeProvider)
{
    private readonly EmailOtpAuthOptions _options =
        options ?? throw new ArgumentNullException(nameof(options));

    private readonly IEmailOtpChallengeRepository _challenges =
        challenges ?? throw new ArgumentNullException(nameof(challenges));

    private readonly IEmailOtpSignInDomainPolicyService _domainPolicy =
        domainPolicy ?? throw new ArgumentNullException(nameof(domainPolicy));

    private readonly IPlatformIdentityService _platformIdentity =
        platformIdentity ?? throw new ArgumentNullException(nameof(platformIdentity));

    private readonly IAuthenticationIdentityRepository _authenticationIdentities =
        authenticationIdentities ?? throw new ArgumentNullException(nameof(authenticationIdentities));

    private readonly IWorkspaceMembershipRepository _memberships =
        memberships ?? throw new ArgumentNullException(nameof(memberships));

    private readonly IUserInvitationRepository _invitations =
        invitations ?? throw new ArgumentNullException(nameof(invitations));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private readonly TimeProvider _timeProvider =
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider));
}
