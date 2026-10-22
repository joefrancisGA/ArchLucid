using ArchLucid.Core.Admin;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;

using Microsoft.Extensions.Options;

namespace ArchLucid.Application.Identity;

public sealed class EmailOtpAuthService(
    IOptions<EmailOtpAuthOptions> options,
    IEmailOtpChallengeRepository challenges,
    IEmailOtpSignInDomainPolicyService domainPolicy,
    IEmailOtpEmailNotifier emailNotifier,
    IPlatformIdentityService platformIdentity,
    IAuthenticationIdentityRepository authenticationIdentities,
    IWorkspaceMembershipRepository memberships,
    IUserInvitationRepository invitations,
    IEmailOtpBotChallengeVerifier botChallengeVerifier,
    IAuditService auditService,
    TimeProvider timeProvider) : IEmailOtpAuthService
{
    private readonly EmailOtpRequestFlow _requestFlow = new(
        options?.Value ?? throw new ArgumentNullException(nameof(options)),
        challenges ?? throw new ArgumentNullException(nameof(challenges)),
        domainPolicy ?? throw new ArgumentNullException(nameof(domainPolicy)),
        emailNotifier ?? throw new ArgumentNullException(nameof(emailNotifier)),
        invitations ?? throw new ArgumentNullException(nameof(invitations)),
        botChallengeVerifier ?? throw new ArgumentNullException(nameof(botChallengeVerifier)),
        auditService ?? throw new ArgumentNullException(nameof(auditService)),
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider)));

    private readonly EmailOtpVerifyFlow _verifyFlow = new(
        options?.Value ?? throw new ArgumentNullException(nameof(options)),
        challenges ?? throw new ArgumentNullException(nameof(challenges)),
        domainPolicy ?? throw new ArgumentNullException(nameof(domainPolicy)),
        platformIdentity ?? throw new ArgumentNullException(nameof(platformIdentity)),
        authenticationIdentities ?? throw new ArgumentNullException(nameof(authenticationIdentities)),
        memberships ?? throw new ArgumentNullException(nameof(memberships)),
        invitations ?? throw new ArgumentNullException(nameof(invitations)),
        auditService ?? throw new ArgumentNullException(nameof(auditService)),
        timeProvider ?? throw new ArgumentNullException(nameof(timeProvider)));

    public Task<EmailOtpChallengeRequestResult> RequestCodeAsync(
        EmailOtpChallengeRequest request,
        CancellationToken cancellationToken) =>
        _requestFlow.ExecuteAsync(request, cancellationToken);

    public Task<EmailOtpVerifyResult> VerifyCodeAsync(
        EmailOtpVerifyRequest request,
        CancellationToken cancellationToken) =>
        _verifyFlow.ExecuteAsync(request, cancellationToken);
}
