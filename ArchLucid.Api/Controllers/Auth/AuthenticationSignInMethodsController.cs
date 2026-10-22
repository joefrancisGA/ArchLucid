using ArchLucid.Api.Auth.Services;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Identity;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Auth;

/// <summary>Account sign-in methods and safe identity linking for the authenticated platform user.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AuthenticatedUserOnly)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/auth/sign-in-methods")]
public sealed partial class AuthenticationSignInMethodsController(
    IAuthenticationIdentityLinkingService linkingService,
    IAuthenticatedPlatformUserResolver userResolver,
    IAuditService auditService) : ControllerBase
{
    private readonly IAuthenticationIdentityLinkingService _linkingService =
        linkingService ?? throw new ArgumentNullException(nameof(linkingService));

    private readonly IAuthenticatedPlatformUserResolver _userResolver =
        userResolver ?? throw new ArgumentNullException(nameof(userResolver));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));

    private IActionResult? EnsureRecentAuthenticationOrError()
    {
        if (!RecentAuthenticationEvaluator.HasRecentAuthentication(User, TimeProvider.System))
        {
            return this.BadRequestProblem(
                "Recent authentication is required. Sign in again and retry.",
                ProblemTypes.ValidationFailed);
        }

        return null;
    }

    private async Task<PlatformUserRecord> RequirePlatformUserAsync(CancellationToken cancellationToken)
    {
        PlatformUserRecord? user =
            await _userResolver.ResolveAsync(User, cancellationToken).ConfigureAwait(false);

        if (user is null)
            throw new UnauthorizedAccessException("Authenticated platform user is required.");

        return user;
    }

    private static string ResolveActorId(PlatformUserRecord user) => user.Id.ToString("D");
}

public sealed class EmailLinkChallengeRequest
{
    public string Email
    {
        get;
        init;
    } = string.Empty;
}

public sealed class EmailLinkChallengeResponse
{
    public Guid ChallengeId
    {
        get;
        init;
    }
}

public sealed class EmailLinkVerifyRequest
{
    public Guid ChallengeId
    {
        get;
        init;
    }

    public string Code
    {
        get;
        init;
    } = string.Empty;
}

public sealed class SignInMethodConfirmedResponse
{
    public Guid IdentityId
    {
        get;
        init;
    }

    public string ProviderType
    {
        get;
        init;
    } = string.Empty;
}
