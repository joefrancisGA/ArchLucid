using ArchLucid.Api.Auth.Services;
using ArchLucid.Application.Audit;
using ArchLucid.Application.Identity;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Configuration;

using ArchLucid.Host.Core.ProblemDetails;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Auth;

/// <summary>Post-authentication workspace bootstrap (invitations, workspace selection, first workspace creation).</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AuthenticatedUserOnly)]
[AllowUnscopedRoute]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/auth/bootstrap")]
public sealed partial class PostAuthBootstrapController(
    IPostAuthBootstrapService bootstrap,
    IAuthenticatedPlatformUserResolver platformUserResolver,
    ILocalTrialJwtIssuer jwtIssuer,
    IOptions<EmailOtpAuthOptions> emailOtpOptions,
    IAuditService auditService) : ControllerBase
{
    private readonly IPostAuthBootstrapService _bootstrap =
        bootstrap ?? throw new ArgumentNullException(nameof(bootstrap));

    private readonly IAuthenticatedPlatformUserResolver _platformUserResolver =
        platformUserResolver ?? throw new ArgumentNullException(nameof(platformUserResolver));

    private readonly ILocalTrialJwtIssuer _jwtIssuer =
        jwtIssuer ?? throw new ArgumentNullException(nameof(jwtIssuer));

    private readonly EmailOtpAuthOptions _emailOtpOptions =
        emailOtpOptions?.Value ?? throw new ArgumentNullException(nameof(emailOtpOptions));

    private readonly IAuditService _auditService =
        auditService ?? throw new ArgumentNullException(nameof(auditService));
}
