using ArchLucid.Api.Diagnostics;
using ArchLucid.Core.Diagnostics;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.OutputCaching;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers;

/// <summary>
///     Returns non-secret build and version identity for the running API process.
///     Intentionally <see cref="AllowAnonymousAttribute" /> so operators and automation
///     can discover version without credentials during pilot/support triage.
///     Marked <see cref="ApiVersionNeutralAttribute" /> because this is infrastructure,
///     not a versioned domain endpoint. Placed under the Controllers root (not <c>Admin/</c>)
///     so tooling does not classify this probe as part of authenticated admin APIs.
/// </summary>
[ApiController]
[Route("version")]
[AllowAnonymous]
[AllowUnscopedRoute]
[ApiVersionNeutral]
[EnableRateLimiting("fixed")]
public sealed class VersionController(IHostEnvironment environment, IConfiguration configuration, TimeProvider timeProvider)
    : ControllerBase
{
    /// <summary>Returns application version, commit SHA, runtime framework, and environment name.</summary>
    [HttpGet]
    [OutputCache(PolicyName = "ImmutableShort")]
    [ProducesResponseType(typeof(BuildInfoResponse), StatusCodes.Status200OK)]
    public IActionResult Get() => Ok(ApiBuildInfoFactory.Create(environment, configuration, timeProvider));
}
