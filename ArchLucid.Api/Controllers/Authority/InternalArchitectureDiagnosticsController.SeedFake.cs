using System.Text.Json;

using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class InternalArchitectureDiagnosticsController
{
    /// <summary>Development seed path for simulator substitution.</summary>
    // idempotency-posture: operator-documented-safe-retry
    [HttpPost("runs/{runId}/seed-fake-results")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [Authorize(Policy = "CanSeedResults")]
    [ProducesResponseType(typeof(SeedFakeResultsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SeedFakeResults(
        [FromRoute] string runId,
        [FromQuery] bool pilotTryRealModeFellBack = false,
        CancellationToken cancellationToken = default)
    {
        PilotSeedFakeResultsOptions? pilot =
            pilotTryRealModeFellBack ? new PilotSeedFakeResultsOptions(true) : null;

        SeedFakeResultsResult result =
            await architectureApplicationService.SeedFakeResultsAsync(runId, pilot, cancellationToken);

        if (!result.Success)
            return MapApplicationServiceFailure(result.Error, result.FailureKind, "Seed failed.");

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        string auditActor = actorContext.GetActor();
        Guid? auditRunId = Guid.TryParse(runId, out Guid rid) ? rid : null;

        await auditService.LogAsync(
            new AuditEvent
            {
                EventType = AuditEventTypes.InternalArchitectureFakeResultsSeeded,
                ActorUserId = auditActor,
                ActorUserName = auditActor,
                TenantId = scope.TenantId,
                WorkspaceId = scope.WorkspaceId,
                ProjectId = scope.ProjectId,
                RunId = auditRunId,
                CorrelationId = HttpContext.TraceIdentifier,
                DataJson = JsonSerializer.Serialize(new { result.ResultCount, pilotTryRealModeFellBack })
            },
            cancellationToken);

        logger.LogInformation(
            "Fake results seeded (internal): RunId={RunId}, ResultCount={ResultCount}",
            LogSanitizer.Sanitize(runId),
            result.ResultCount);

        return Ok(new SeedFakeResultsResponse { ResultCount = result.ResultCount });
    }

    private IActionResult MapApplicationServiceFailure(string? error, ApplicationServiceFailureKind? kind,
        string defaultBadRequestDetail)
    {
        string detail = string.IsNullOrWhiteSpace(error) ? defaultBadRequestDetail : error;
        return kind switch
        {
            ApplicationServiceFailureKind.RunNotFound => this.NotFoundProblem(detail, ProblemTypes.RunNotFound),
            ApplicationServiceFailureKind.ResourceNotFound => this.NotFoundProblem(detail,
                ProblemTypes.ResourceNotFound),
            _ => this.BadRequestProblem(detail)
        };
    }
}
