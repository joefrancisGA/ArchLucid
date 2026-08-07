using ArchLucid.Api.Contracts;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Operations;
using ArchLucid.Contracts.Operations;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

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
  IScopeContextProvider scopeContextProvider) : ControllerBase
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
