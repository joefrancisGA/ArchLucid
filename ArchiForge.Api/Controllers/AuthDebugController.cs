using ArchiForge.Api.Auth.Models;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchiForge.Api.Controllers;

/// <summary>
/// Diagnostic endpoint for inspecting the caller's authenticated identity and claims.
/// </summary>
/// <remarks>Requires <see cref="ArchiForgePolicies.ReadAuthority"/>. Useful for debugging token claims in development and staging.</remarks>
[Authorize(Policy = ArchiForgePolicies.ReadAuthority)]
[ApiController]
[Route("api/auth")]
public sealed class AuthDebugController : ControllerBase
{
    /// <summary>Returns the caller's identity name and full claims list.</summary>
    /// <returns>200 with <c>name</c> and <c>claims</c> array.</returns>
    [HttpGet("me")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public IActionResult Me()
    {
        return Ok(new
        {
            User.Identity?.Name,
            Claims = User.Claims.Select(x => new
            {
                x.Type,
                x.Value
            }).ToList()
        });
    }
}
