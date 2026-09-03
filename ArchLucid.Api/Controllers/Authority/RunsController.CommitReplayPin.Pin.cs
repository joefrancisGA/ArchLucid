using ArchLucid.Api.Contracts;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class RunsController
{
    [HttpPatch("review/{runId}/pin")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(PinRunResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PinRun(
        [FromRoute] string runId,
        [FromBody] PinRunRequest? request,
        CancellationToken cancellationToken)
    {
        if (!TryParseRunGuidForAudit(runId, out Guid runGuid))
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunRecord? run = await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken);

        if (run is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        bool nextPinned = request?.IsPinned ?? !run.IsPinned;
        run.IsPinned = nextPinned;

        try
        {
            await _runRepository.UpdateAsync(run, cancellationToken);
        }
        catch (InvalidOperationException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }

        string auditActor = actorContext.GetActor();

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.RunPinStateChanged,
                ActorUserId = auditActor,
                ActorUserName = auditActor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = runGuid,
                CorrelationId = HttpContext.TraceIdentifier,
                DataJson = System.Text.Json.JsonSerializer.Serialize(
                    new { isPinned = run.IsPinned },
                    Persistence.Serialization.AuditJsonSerializationOptions.Instance)
            },
            cancellationToken);

        return Ok(new PinRunResponse { RunId = run.RunId.ToString("N"), IsPinned = run.IsPinned });
    }
}
