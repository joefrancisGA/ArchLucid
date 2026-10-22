using ArchLucid.Api.Models.Integrations;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Integrations;
using ArchLucid.Core.Scoping;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Integrations;

public sealed partial class ItsmCorrelationController
{
    /// <summary>Lists ITSM ticket correlations for multiple findings in the current tenant scope.</summary>
    [HttpGet("batch")]
    [ProducesResponseType(typeof(ItsmFindingCorrelationsBatchResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ListByFindings([FromQuery] string[] findingIds, CancellationToken ct)
    {
        if (findingIds is null || findingIds.Length == 0)
        {
            return Ok(new ItsmFindingCorrelationsBatchResponse
            {
                Findings = Array.Empty<ItsmFindingCorrelationsByFindingResponse>()
            });
        }

        if (findingIds.Length > MaxBatchFindingIds)
        {
            return this.BadRequestProblem(
                $"At most {MaxBatchFindingIds} findingIds are allowed per request.",
                ProblemTypes.ValidationFailed);
        }

        ScopeContext ctx = _scope.GetCurrentScope();

        ItsmFindingCorrelationsBatchResponse body =
            await _correlationQuery.ListForFindingsAsync(ctx, findingIds, ct).ConfigureAwait(false);

        return Ok(body);
    }

    /// <summary>Lists ITSM ticket correlations for a finding in the current tenant scope (TB-063).</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ItsmFindingCorrelationsByFindingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> ListByFinding([FromQuery] string findingId, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(findingId))
            return this.BadRequestProblem("findingId is required.", ProblemTypes.ValidationFailed);

        ScopeContext ctx = _scope.GetCurrentScope();

        ItsmFindingCorrelationsByFindingResponse body =
            await _correlationQuery.ListForFindingAsync(ctx, findingId, ct).ConfigureAwait(false);

        return Ok(body);
    }
}
