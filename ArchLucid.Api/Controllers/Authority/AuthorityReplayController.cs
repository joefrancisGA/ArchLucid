using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.Contracts;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;
using ArchLucid.Persistence.Coordination.Replay;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
///     Executes authority run replay (validate, optionally rebuild manifest/trace and artifacts) for the authenticated
///     scope.
/// </summary>
/// <remarks>
///     POST <c>/v1/internal/authority/replay</c> (legacy: <c>/v1/authority/replay</c>); uses <see cref="ReplayMode" />
///     strings from the request body. Emits
///     <see cref="AuditEventTypes.ReplayExecuted" /> on success.
/// </remarks>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.RequireOperatorRole)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/internal/authority/replay")]
[EnableRateLimiting("fixed")]
[RequiresCommercialTenantTier(TenantTier.Standard)]
[ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status429TooManyRequests)]
public sealed class AuthorityReplayController(
    IAuthorityReplayService replayService,
    IAuditService auditService,
    IActorContext actorContext,
    IScopeContextProvider scopeContextProvider) : ControllerBase
{
    /// <summary>Runs replay for the run and mode in <paramref name="request" />.</summary>
    /// <param name="request">Run id and optional mode (defaults to <see cref="ReplayMode.ReconstructOnly" />).</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns>
    ///     <see cref="ReplayResponse" /> with validation and rebuilt entity ids when applicable, or 404 when the run is
    ///     unknown.
    /// </returns>
    [HttpPost]
    [HttpPost("/v{version:apiVersion}/authority/replay")]
    [ProducesResponseType(typeof(ReplayResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Replay(
        [FromBody] ReplayRequestResponse? request,
        CancellationToken ct = default)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        string mode = string.IsNullOrWhiteSpace(request.Mode)
            ? ReplayMode.ReconstructOnly
            : request.Mode.Trim();

        ReplayResult? result = await replayService.ReplayAsync(
            new ReplayRequest { RunId = request.RunId, Mode = mode },
            ct);

        if (result is null)
            return this.NotFoundProblem($"Run '{request.RunId}' was not found.", ProblemTypes.RunNotFound);

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        string actor = actorContext.GetActor();

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.ReplayExecuted,
                ActorUserId = actor,
                ActorUserName = actor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = request.RunId,
                DataJson = JsonSerializer.Serialize(new { mode, result.RebuiltManifest?.ManifestId })
            },
            ct);

        ReplayValidationResponse validation = new()
        {
            ContextPresent = result.Validation.ContextPresent,
            GraphPresent = result.Validation.GraphPresent,
            FindingsPresent = result.Validation.FindingsPresent,
            ManifestPresent = result.Validation.ManifestPresent,
            TracePresent = result.Validation.TracePresent,
            ArtifactsPresent = result.Validation.ArtifactsPresent,
            ManifestHashMatches = result.Validation.ManifestHashMatches,
            ArtifactBundlePresentAfterReplay = result.Validation.ArtifactBundlePresentAfterReplay,
            Notes = result.Validation.Notes,
            HasValidationNotes = result.Validation.Notes.Count > 0
        };

        return Ok(new ReplayResponse
        {
            RunId = result.RunId,
            Mode = result.Mode,
            ReplayedUtc = result.ReplayedUtc,
            RebuiltManifestId = result.RebuiltManifest?.ManifestId,
            RebuiltManifestHash = result.RebuiltManifest?.ManifestHash,
            RebuiltArtifactBundleId = result.RebuiltArtifactBundle?.BundleId,
            Validation = validation,
            HasRebuildOutput = result.RebuiltManifest is not null || result.RebuiltArtifactBundle is not null,
            ValidationNoteCount = validation.Notes.Count
        });
    }
}
