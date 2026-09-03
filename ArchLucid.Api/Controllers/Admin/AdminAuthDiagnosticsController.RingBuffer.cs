using ArchLucid.Contracts.Admin;
using ArchLucid.Host.Core.Services;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Admin;

public sealed partial class AdminAuthDiagnosticsController
{
    private const int MaxAuthDiagnosticsEntries = 200;

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
            authDiagnosticsRingBuffer.GetRecent(Math.Clamp(maxCount, 1, MaxAuthDiagnosticsEntries));

        return Ok(entries);
    }
}
