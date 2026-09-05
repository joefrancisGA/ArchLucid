using ArchLucid.Api.Models.Coverage;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application;
using ArchLucid.Application.Governance.Coverage;
using ArchLucid.Contracts.Governance.Coverage;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.ProblemDetails;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class RunCoverageController
{
    [HttpGet("{runId:guid}/coverage/acknowledgement")]
    [ProducesResponseType(typeof(RunAcknowledgedCoverageDocument), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAcknowledgedCoverage(Guid runId, CancellationToken cancellationToken)
    {
        try
        {
            ScopeContext scope = scopeContextProvider.GetCurrentScope();
            RunAcknowledgedCoverageDocument? document =
                await acknowledgementService.GetAsync(scope, runId, cancellationToken);

            return Ok(document ?? new RunAcknowledgedCoverageDocument());
        }
        catch (RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
    }

    [HttpPut("{runId:guid}/coverage/acknowledgement")]
    [Authorize(Policy = ArchLucidPolicies.PolicyPackMutationAuthority)]
    [MutatingAuditExcluded("Audit: RunCoverageAcknowledgementService persists acknowledgement and logs RunCoverageAcknowledged.")]
    [ProducesResponseType(typeof(RunAcknowledgedCoverageDocument), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> PutAcknowledgedCoverage(
        Guid runId,
        [FromBody] PutRunCoverageAcknowledgementRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        try
        {
            ScopeContext scope = scopeContextProvider.GetCurrentScope();
            RunAcknowledgedCoverageDocument document = new()
            {
                Entries = request.Entries?
                    .Select(static row => new RunCoverageAcknowledgementEntry
                    {
                        PolicyPackId = row.PolicyPackId,
                        Excluded = row.Excluded,
                        ExclusionReason = row.ExclusionReason,
                    })
                    .ToList() ?? [],
            };

            RunAcknowledgedCoverageDocument saved =
                await acknowledgementService.PutAcknowledgementAsync(scope, runId, document, cancellationToken);

            return Ok(saved);
        }
        catch (RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (InvalidOperationException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
    }

    [HttpPatch("{runId:guid}/coverage/{policyPackId:guid}")]
    [Authorize(Policy = ArchLucidPolicies.PolicyPackMutationAuthority)]
    [MutatingAuditExcluded("Audit: RunCoverageAcknowledgementService persists acknowledgement and logs RunCoverageAcknowledged.")]
    [ProducesResponseType(typeof(RunCoverageAcknowledgementEntry), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> PatchRunCoveragePack(
        Guid runId,
        Guid policyPackId,
        [FromBody] PatchRunCoveragePackRequest? request,
        CancellationToken cancellationToken)
    {
        if (request is null)
            return this.BadRequestProblem("Request body is required.", ProblemTypes.RequestBodyRequired);

        try
        {
            ScopeContext scope = scopeContextProvider.GetCurrentScope();
            RunCoverageAcknowledgementEntry entry = await acknowledgementService.PatchPackExclusionAsync(
                scope,
                runId,
                policyPackId,
                request.Excluded,
                request.ExclusionReason,
                cancellationToken);

            return Ok(entry);
        }
        catch (RunNotFoundException ex)
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
        catch (ArgumentException ex)
        {
            return this.BadRequestProblem(ex.Message, ProblemTypes.ValidationFailed);
        }
        catch (InvalidOperationException ex)
        {
            return this.ConflictProblem(ex.Message, ProblemTypes.Conflict);
        }
    }
}
