using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Operations;
using ArchLucid.Api.Contracts;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Operations;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Serialization;

using System.Text.Json;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Admin;

/// <summary>Unified poll target for long-running work (runs, exports, future async execute).</summary>
/// <remarks>Routes under <c>v{version}/operations</c>.</remarks>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[Route("v{version:apiVersion}/operations")]
[ApiVersion("1.0")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[EnableRateLimiting("fixed")]
public sealed class OperationsController(
  IOperationQueryService operationQueryService,
  IOperationCancelService operationCancelService,
  IScopeContextProvider scopeContextProvider,
  IActorContext actorContext,
  IAuditService auditService) : ControllerBase
{
  /// <summary>Returns the current state of a long-running operation.</summary>
  /// <param name="operationId">Opaque operation handle (for example <c>job:{jobId}</c> or <c>run:{runId}</c>).</param>
  [HttpGet("{operationId}")]
  [ProducesResponseType(typeof(OperationResponse), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
  public async Task<IActionResult> GetOperation(
    [FromRoute] string operationId,
    CancellationToken cancellationToken)
  {
    if (string.IsNullOrWhiteSpace(operationId))
      return this.BadRequestProblem("operationId is required.", ProblemTypes.ValidationFailed);

    OperationDetail? detail = await operationQueryService.GetAsync(
      operationId,
      scopeContextProvider.GetCurrentScope(),
      cancellationToken);

    if (detail is null)
    {
      return this.NotFoundProblem(
        $"Operation '{operationId}' was not found.",
        ProblemTypes.ResourceNotFound);
    }

    return Ok(ToResponse(detail));
  }

  /// <summary>Requests cooperative cancel for a long-running operation (TB-2076).</summary>
  // idempotency-posture: operator-documented-safe-retry
  [HttpPost("{operationId}/cancel")]
  [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
  [ProducesResponseType(typeof(OperationResponse), StatusCodes.Status200OK)]
  [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status400BadRequest)]
  [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
  [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
  public async Task<IActionResult> CancelOperation(
    [FromRoute] string operationId,
    CancellationToken cancellationToken)
  {
    if (string.IsNullOrWhiteSpace(operationId))
      return this.BadRequestProblem("operationId is required.", ProblemTypes.ValidationFailed);

    try
    {
      ScopeContext scope = scopeContextProvider.GetCurrentScope();
      string actor = actorContext.GetActor();

      OperationDetail detail = await operationCancelService.RequestCancelAsync(
        operationId,
        scope,
        cancellationToken);

      await auditService.LogAsync(
        new AuditEvent
        {
          EventType = AuditEventTypes.Operation.CancelRequested,
          ActorUserId = actor,
          ActorUserName = actor,
          TenantId = scope.TenantId,
          WorkspaceId = scope.WorkspaceId,
          ProjectId = scope.ProjectId,
          CorrelationId = HttpContext.TraceIdentifier,
          DataJson = JsonSerializer.Serialize(
            new { operationId, state = detail.State.ToString() },
            AuditJsonSerializationOptions.Instance)
        },
        cancellationToken);

      return Ok(ToResponse(detail));
    }
    catch (RunNotFoundException ex)
    {
      return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
    }
    catch (ConflictException ex)
    {
      return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
    }
  }

  private static OperationResponse ToResponse(OperationDetail detail)
  {
    OperationResultRefResponse? resultRef = detail.ResultRef is null
      ? null
      : new OperationResultRefResponse
      {
        RunId = detail.ResultRef.RunId,
        JobId = detail.ResultRef.JobId,
        DownloadPath = detail.ResultRef.DownloadPath
      };

    return new OperationResponse
    {
      OperationId = detail.OperationId,
      State = detail.State,
      StepLabel = detail.StepLabel,
      CurrentStep = detail.CurrentStep,
      TotalSteps = detail.TotalSteps,
      HeartbeatUtc = detail.HeartbeatUtc,
      ResultRef = resultRef
    };
  }
}
