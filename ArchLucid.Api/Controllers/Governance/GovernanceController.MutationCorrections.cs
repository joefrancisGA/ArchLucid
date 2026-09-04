using ArchLucid.Api.Http;
using ArchLucid.Api.Http.Governance;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Governance;

public sealed partial class GovernanceController
{
    [HttpPost("mutation-corrections")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Audit: IGovernanceMutationCorrectionService logs GovernanceMutationCorrectionRecorded.")]
    [ProducesResponseType(typeof(GovernanceMutationCorrectionRecordedDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> RecordGovernanceMutationCorrection(
        [FromBody] RecordGovernanceMutationCorrectionRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        IActionResult? validationProblem =
            GovernanceMutationCorrectionsHttpMapper.ValidateRecordMutationCorrection(request)
                .ToBadRequestProblemOrNull(this);

        if (validationProblem is not null)
            return validationProblem;

        IActionResult? tenantProblem = await RequireTenantAndWorkspaceOrNotFoundAsync(cancellationToken).ConfigureAwait(false);

        if (tenantProblem is not null)
            return tenantProblem;

        string actorUserId = actorContext.GetActor();

        try
        {
            ScopeContext scope = _scopeContextProvider.GetCurrentScope();
            GovernanceMutationCorrectionRecordedDto result = await _governanceMutationCorrectionService.RecordAsync(
                request,
                scope,
                actorUserId,
                cancellationToken);

            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            logger.LogWarning(ex, "Governance mutation correction failed: subject not found.");
            return this.NotFoundProblem(ex.Message, ProblemTypes.ResourceNotFound);
        }
        catch (ArgumentException ex)
        {
            logger.LogWarning(ex, "Governance mutation correction failed: validation error.");
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (ConflictException ex)
        {
            logger.LogWarning(ex, "Governance mutation correction failed: lifecycle conflict.");
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
        catch (InvalidOperationException ex)
        {
            logger.LogWarning(ex, "Governance mutation correction failed: invalid state.");
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (RunNotFoundException ex)
        {
            logger.LogWarning(ex, "Governance mutation correction failed: run not found.");
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
    }
}
