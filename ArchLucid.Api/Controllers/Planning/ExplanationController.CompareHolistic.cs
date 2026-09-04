using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Explanation.Models;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Planning;

public sealed partial class ExplanationController
{
    /// <summary>AI narrative for manifest delta between two runs (base → target).</summary>
    /// <param name="baseRunId">Baseline run.</param>
    /// <param name="targetRunId">Target run.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns><see cref="ComparisonExplanationResult" /> JSON, or 404 when either run lacks a golden manifest in scope.</returns>
    [HttpGet("compare/explain")]
    [ProducesResponseType(typeof(ComparisonExplanationResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ExplainComparison(
        [FromQuery] Guid baseRunId,
        [FromQuery] Guid targetRunId,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunDetailDto? baseRun = await query.GetRunDetailAsync(scope, baseRunId, ct);
        RunDetailDto? targetRun = await query.GetRunDetailAsync(scope, targetRunId, ct);
        if (baseRun?.GoldenManifest is null || targetRun?.GoldenManifest is null)
            return this.NotFoundProblem(
                "One or both runs were not found or have no committed manifest in the current scope.",
                ProblemTypes.RunNotFound);

        ComparisonResult comparison1 = comparison.Compare(baseRun.GoldenManifest, targetRun.GoldenManifest);
        ComparisonExplanationResult result = await explanation.ExplainComparisonAsync(comparison1, ct);
        return Ok(result);
    }

    /// <summary>Unstructured holistic architecture critique (advisory; not persisted as findings).</summary>
    // idempotency-posture: dry-run-no-persist
    [HttpPost("runs/{runId:guid}/holistic-critic")]
    [Authorize(Policy = ArchLucidPolicies.ExecuteAuthority)]
    [MutatingAuditExcluded("Holistic critic is advisory-only and does not persist domain mutations.")]
    [ProducesResponseType(typeof(HolisticCriticResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> HolisticCritic(
        Guid runId,
        [FromBody] HolisticCriticRequest? request,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();

        try
        {
            HolisticCriticResponse response = await holisticCriticService.GenerateAsync(scope, runId, request, ct);
            return Ok(response);
        }
        catch (InvalidOperationException ex) when (ex.Message.Contains("not found", StringComparison.OrdinalIgnoreCase))
        {
            return this.NotFoundProblem(ex.Message, ProblemTypes.RunNotFound);
        }
    }
}
