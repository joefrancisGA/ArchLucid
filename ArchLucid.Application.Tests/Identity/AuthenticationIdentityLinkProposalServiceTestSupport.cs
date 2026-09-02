using ArchLucid.Application.Identity;
using ArchLucid.Application.Identity.LinkProposal;
using ArchLucid.Core.Identity;

namespace ArchLucid.Application.Tests.Identity;

internal static class AuthenticationIdentityLinkProposalServiceTestSupport
{
    public static AuthenticationIdentityLinkProposalService Create(
        IPlatformIdentityService platformIdentity,
        IPlatformUserRepository users,
        IAuthenticationIdentityRepository identities,
        IAuthenticationIdentityLinkProposalPersistStage proposalPersistStage,
        IIdentityMigrationReviewRepository migrationReviews,
        IAuthenticationIdentityLinkProposalAuditNotifier proposalAuditNotifier,
        TimeProvider timeProvider)
    {
        ExternalKeyEligibilityChecker eligibilityChecker = new(
            identities,
            migrationReviews,
            proposalAuditNotifier,
            timeProvider);

        AuthenticationIdentityLinkProposalCreateStage createStage = new(
            users,
            proposalPersistStage,
            proposalAuditNotifier,
            eligibilityChecker,
            timeProvider);

        AuthenticationIdentityLinkProposalConfirmStage confirmStage = new(
            platformIdentity,
            proposalPersistStage,
            proposalAuditNotifier,
            eligibilityChecker,
            timeProvider);

        AuthenticationIdentityLinkProposalCancelStage cancelStage = new(
            proposalPersistStage,
            proposalAuditNotifier,
            timeProvider);

        return new AuthenticationIdentityLinkProposalService(
            createStage,
            confirmStage,
            cancelStage,
            eligibilityChecker);
    }
}
