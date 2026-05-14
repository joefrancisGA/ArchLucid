using ArchLucid.Core.Authorization;
using ArchLucid.Host.Core.Services;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>
///     Admin endpoint for inspecting recent IdP JWT claim-mapping failures to aid SSO onboarding troubleshooting.
/// </summary>
/// <remarks>
///     Only captures authentication events where the JWT is valid but maps to no known ArchLucid role.
///     No PII, raw token bytes, or secrets are retained — only safe metadata (issuer, audience, role claim values, and
///     absent/unrecognised claim names). Gated by <see cref="ArchLucidPolicies.AdminAuthority" />.
/// </remarks>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.AdminAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/admin")]
public sealed class AdminAuthDiagnosticsController(IAuthDiagnosticsRingBuffer authDiagnosticsRingBuffer) : ControllerBase
{
    private const int MaxAuthDiagnosticsEntries = 200;

    private readonly IAuthDiagnosticsRingBuffer _authDiagnosticsRingBuffer =
        authDiagnosticsRingBuffer ?? throw new ArgumentNullException(nameof(authDiagnosticsRingBuffer));

    /// <summary>
    ///     Returns the most recent IdP JWT role-mapping failures captured in the in-memory ring buffer.
    /// </summary>
    /// <param name="maxCount">
    ///     Maximum entries to return (1–<see cref="MaxAuthDiagnosticsEntries" />; defaults to 50).
    /// </param>
    [HttpGet("auth-diagnostics")]
    [ProducesResponseType(typeof(IReadOnlyList<AuthDiagnosticEntry>), StatusCodes.Status200OK)]
    public IActionResult GetAuthDiagnostics([FromQuery] int maxCount = 50)
    {
        IReadOnlyList<AuthDiagnosticEntry> entries =
            _authDiagnosticsRingBuffer.GetRecent(Math.Clamp(maxCount, 1, MaxAuthDiagnosticsEntries));

        return Ok(entries);
    }
}
