using ArchLucid.Application.Architecture;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Architecture;

/// <summary>Non-mutating workspace review/architecture name availability probes for intake forms.</summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/architecture")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
public sealed class WorkspaceSystemNameAvailabilityController(
    IScopeContextProvider scopeProvider,
    IWorkspaceSystemNameCollisionGuard collisionGuard) : ControllerBase
{
    private readonly IWorkspaceSystemNameCollisionGuard _collisionGuard =
        collisionGuard ?? throw new ArgumentNullException(nameof(collisionGuard));

    private readonly IScopeContextProvider _scopeProvider =
        scopeProvider ?? throw new ArgumentNullException(nameof(scopeProvider));

    /// <summary>
    ///     Checks whether <paramref name="systemName" /> is free in the current workspace before create/patch/submit.
    /// </summary>
    [HttpGet("workspace-system-name-availability")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(WorkspaceSystemNameAvailabilityResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<WorkspaceSystemNameAvailabilityResponse>> GetAsync(
        [FromQuery] string? systemName,
        [FromQuery] Guid? excludeDraftId,
        [FromQuery] Guid? excludeRunId,
        CancellationToken cancellationToken)
    {
        string trimmedName = systemName?.Trim() ?? string.Empty;

        if (trimmedName.Length == 0)
        {
            return Ok(new WorkspaceSystemNameAvailabilityResponse
            {
                SystemName = string.Empty,
                IsAvailable = true,
            });
        }

        ScopeContext scope = _scopeProvider.GetCurrentScope();
        bool isAvailable = await _collisionGuard
            .IsAvailableAsync(scope, trimmedName, excludeDraftId, excludeRunId, cancellationToken)
            .ConfigureAwait(false);

        return Ok(new WorkspaceSystemNameAvailabilityResponse
        {
            SystemName = trimmedName,
            IsAvailable = isAvailable,
            ConflictMessage = isAvailable
                ? null
                : WorkspaceSystemNameCollisionGuard.BuildConflictMessage(trimmedName),
        });
    }
}
