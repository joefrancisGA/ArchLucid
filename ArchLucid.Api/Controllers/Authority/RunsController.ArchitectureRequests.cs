using System.Text.Json;

using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Serialization;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
///     Stored <see cref="ArchitectureRequest" /> curation: read, clone as a template, and archive/restore so a request
///     can be hidden from default list views without losing it.
/// </summary>
public sealed partial class RunsController
{
    /// <summary>
    ///     Gets the original architecture request payload by ID.
    /// </summary>
    [HttpGet("request/{requestId}")]
    [Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
    [ProducesResponseType(typeof(ArchitectureRequest), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRequest(
        [FromRoute] string requestId,
        [FromServices] IArchitectureRequestRepository requestRepository,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(requestId))
            return this.BadRequestProblem("requestId is required.", ProblemTypes.ValidationFailed);

        ArchitectureRequest? request =
            await LoadScopedArchitectureRequestAsync(requestId, requestRepository, cancellationToken);

        if (request is null)
            return this.NotFoundProblem($"Request '{requestId}' was not found.", ProblemTypes.ResourceNotFound);

        return Ok(request);
    }

    /// <summary>
    ///     Clones an existing architecture request, stripping its ID so it can be used as a template for a new run.
    /// </summary>
    [IdempotencyFilter]
    [HttpPost("request/{requestId}/clone")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(ArchitectureRequest), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CloneRequest(
        [FromRoute] string requestId,
        [FromServices] IArchitectureRequestRepository requestRepository,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(requestId))
            return this.BadRequestProblem("requestId is required.", ProblemTypes.ValidationFailed);

        ArchitectureRequest? request =
            await LoadScopedArchitectureRequestAsync(requestId, requestRepository, cancellationToken);

        if (request is null)
            return this.NotFoundProblem($"Request '{requestId}' was not found.", ProblemTypes.ResourceNotFound);

        // Strip the ID to make it a template for a new request
        request.RequestId = Guid.NewGuid().ToString("N");
        request.IsArchived = false;

        return Ok(request);
    }

    /// <summary>
    ///     Archives an architecture request, hiding it from default list views.
    /// </summary>
    [HttpPatch("request/{requestId}/archive")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ArchiveRequest(
        [FromRoute] string requestId,
        [FromServices] IArchitectureRequestRepository requestRepository,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(requestId))
            return this.BadRequestProblem("requestId is required.", ProblemTypes.ValidationFailed);

        ArchitectureRequest? request =
            await LoadScopedArchitectureRequestAsync(requestId, requestRepository, cancellationToken);

        if (request is null)
            return this.NotFoundProblem($"Request '{requestId}' was not found.", ProblemTypes.ResourceNotFound);

        await requestRepository.ArchiveAsync(requestId, cancellationToken);

        await auditService.LogAsync(
            BuildArchitectureRequestAuditEvent("ArchitectureRequestArchived", requestId),
            cancellationToken);

        return Ok();
    }

    /// <summary>
    ///     Soft-deletes an architecture request by marking it archived (hidden from default list views).
    /// </summary>
    [HttpDelete("request/{requestId}")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteRequest(
        [FromRoute] string requestId,
        [FromServices] IArchitectureRequestRepository requestRepository,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(requestId))
            return this.BadRequestProblem("requestId is required.", ProblemTypes.ValidationFailed);

        ArchitectureRequest? request =
            await LoadScopedArchitectureRequestAsync(requestId, requestRepository, cancellationToken);

        if (request is null)
            return this.NotFoundProblem($"Request '{requestId}' was not found.", ProblemTypes.ResourceNotFound);

        if (request.IsArchived)
            return Ok();

        await requestRepository.ArchiveAsync(requestId, cancellationToken);

        await auditService.LogAsync(
            BuildArchitectureRequestAuditEvent("ArchitectureRequestDeleted", requestId),
            cancellationToken);

        return Ok();
    }

    /// <summary>
    ///     Restores an archived architecture request so it appears in default list views again.
    /// </summary>
    [IdempotencyFilter]
    [HttpPost("request/{requestId}/restore")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RestoreRequest(
        [FromRoute] string requestId,
        [FromServices] IArchitectureRequestRepository requestRepository,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(requestId))
            return this.BadRequestProblem("requestId is required.", ProblemTypes.ValidationFailed);

        ArchitectureRequest? request =
            await LoadScopedArchitectureRequestAsync(requestId, requestRepository, cancellationToken);

        if (request is null)
            return this.NotFoundProblem($"Request '{requestId}' was not found.", ProblemTypes.ResourceNotFound);

        if (!request.IsArchived)
            return Ok();

        await requestRepository.RestoreAsync(requestId, cancellationToken);

        await auditService.LogAsync(
            BuildArchitectureRequestAuditEvent("ArchitectureRequestRestored", requestId),
            cancellationToken);

        return Ok();
    }

    /// <summary>
    ///     Loads an architecture request only when the caller's scope has at least one run linked to it.
    ///     Returns <see langword="null" /> when the row is missing or out of scope (same 404 surface).
    /// </summary>
    private async Task<ArchitectureRequest?> LoadScopedArchitectureRequestAsync(
        string requestId,
        IArchitectureRequestRepository requestRepository,
        CancellationToken cancellationToken)
    {
        ArchitectureRequest? request = await requestRepository.GetByIdAsync(requestId, cancellationToken);

        if (request is null)
            return null;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        if (!await _runRepository.ExistsRunForArchitectureRequestInScopeAsync(scope, requestId, cancellationToken))
            return null;

        return request;
    }

    /// <summary>
    ///     Builds the audit event shared by archive, delete, and restore; only the event type distinguishes them.
    /// </summary>
    /// <remarks>
    ///     Actions call <see cref="IAuditService.LogAsync" /> themselves instead of delegating the whole write, because
    ///     the <c>AL0003</c> analyzer requires the audit call to appear in the action body.
    /// </remarks>
    private AuditEvent BuildArchitectureRequestAuditEvent(string eventType, string requestId)
    {
        string auditActor = actorContext.GetActor();
        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        return new AuditEvent
        {
            EventType = eventType,
            ActorUserId = auditActor,
            ActorUserName = auditActor,
            TenantId = scope.TenantId,
            WorkspaceId = scope.WorkspaceId,
            ProjectId = scope.ProjectId,
            CorrelationId = HttpContext.TraceIdentifier,
            DataJson = JsonSerializer.Serialize(
                new { requestId },
                AuditJsonSerializationOptions.Instance)
        };
    }
}
