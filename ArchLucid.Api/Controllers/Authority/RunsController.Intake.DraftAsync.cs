using ArchLucid.Api.Attributes;
using ArchLucid.Api.Contracts;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Operations;
using ArchLucid.Application.Planning;
using ArchLucid.Application.Planning.AdvisoryDraft;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class RunsController
{
    [HttpPost("request/draft/async")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [AsyncRequired]
    [MutatingAuditExcluded("Async draft endpoint is advisory-only and does not persist domain mutations.")]
    [ProducesResponseType(StatusCodes.Status202Accepted)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [EnableRateLimiting("expensive")]
    public async Task<IActionResult> DraftRequestAsync(
        [FromBody] DraftArchitectureRequestInput? input,
        [FromServices] IArchitectureRequestIntakeFacade intakeFacade,
        [FromServices] IAdvisoryDraftOperationAcceptor advisoryDraftOperationAcceptor,
        CancellationToken cancellationToken)
    {
        IActionResult? validation = ValidateDraftFreeText(input?.FreeTextDescription, "FreeTextDescription");
        if (validation is not null)
            return validation;

        string operationId = await advisoryDraftOperationAcceptor.AcceptAsync(
            input!,
            scopeContextProvider.GetCurrentScope(),
            cancellationToken);

        Response.Headers.Location = $"/v1/operations/{operationId}";
        return StatusCode(StatusCodes.Status202Accepted);
    }

    [HttpGet("request/draft/async/{operationId:guid}/result")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [ProducesResponseType(typeof(DraftArchitectureRequestResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public IActionResult GetDraftRequestAsyncResult(
        [FromRoute] Guid operationId,
        [FromServices] IArchitectureRequestIntakeFacade intakeFacade)
    {
        AdvisoryDraftOperationQueryResult result =
            intakeFacade.GetDraftAsyncResult(operationId, scopeContextProvider.GetCurrentScope());

        return result.Outcome switch
        {
            AdvisoryDraftOperationOutcome.Success => Ok(result.Result!),
            AdvisoryDraftOperationOutcome.NotFound => this.NotFoundProblem(
                "Advisory draft operation was not found for this workspace.",
                ProblemTypes.ResourceNotFound),
            AdvisoryDraftOperationOutcome.InProgress => this.ConflictProblem(
                "Structured brief suggestions are still in progress.",
                ProblemTypes.Conflict),
            AdvisoryDraftOperationOutcome.Failed => this.UnprocessableEntityProblem(
                result.ErrorMessage ?? "Structured brief suggestion failed.",
                ProblemTypes.BusinessRuleViolation),
            AdvisoryDraftOperationOutcome.Canceled => this.ConflictProblem(
                "Structured brief suggestion was canceled.",
                ProblemTypes.Conflict),
            AdvisoryDraftOperationOutcome.ResultUnavailable => this.NotFoundProblem(
                "Structured brief suggestion result is not available.",
                ProblemTypes.ResourceNotFound),
            _ => throw new InvalidOperationException($"Unexpected draft operation outcome: {result.Outcome}."),
        };
    }
}
