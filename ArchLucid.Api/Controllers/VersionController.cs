using ArchLucid.Core.Diagnostics;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

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
[ApiVersionNeutral]
public sealed class VersionController(IHostEnvironment environment) : ControllerBase
{
    private static readonly BuildProvenance Provenance =
        BuildProvenance.FromAssembly(typeof(VersionController).Assembly);

    /// <summary>Returns application version, commit SHA, runtime framework, and environment name.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(BuildInfoResponse), StatusCodes.Status200OK)]
    public IActionResult Get()
    {
        BuildInfoResponse response = BuildInfoResponse.FromProvenance(
            Provenance,
            "ArchLucid.Api",
            environment.EnvironmentName);

        return Ok(response);
    }
}
