using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Explanation.Models;
using ArchLucid.Core.Scoping;
using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Queries;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Planning;

public sealed partial class ExplanationController
{
    /// <summary>
    ///     Returns persisted <c>ExplainabilityTrace</c> fields for one finding on an authority run (no LLM).
    /// </summary>
    [HttpGet("runs/{runId:guid}/findings/{findingId}/explainability")]
    [ProducesResponseType(typeof(FindingExplainabilityResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFindingExplainability(
        Guid runId,
        string findingId,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(findingId);

        ScopeContext scope = scopeProvider.GetCurrentScope();
        RunDetailDto? detail = await query.GetRunDetailAsync(scope, runId, ct);
        if (detail?.FindingsSnapshot?.Findings is not { Count: > 0 } list)
            return this.NotFoundProblem(
                $"Run '{runId}' has no findings snapshot in the current scope.",
                ProblemTypes.RunNotFound);

        Finding? match = list.FirstOrDefault(f =>
            string.Equals(f.FindingId, findingId, StringComparison.OrdinalIgnoreCase));

        if (match is null)
            return this.NotFoundProblem(
                $"Finding '{findingId}' was not found on run '{runId}'.",
                ProblemTypes.ResourceNotFound);

        FindingExplainabilityResult body = findingExplainabilityComposer.Compose(match);

        return Ok(body);
    }

    /// <summary>
    ///     Returns deny-list redacted system/user prompts and raw LLM completion for the best-matching agent trace for this
    ///     finding.
    /// </summary>
    [HttpGet("runs/{runId:guid}/findings/{findingId}/llm-audit")]
    [ProducesResponseType(typeof(FindingLlmAuditResult), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetFindingLlmAudit(
        Guid runId,
        string findingId,
        CancellationToken ct = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(findingId);

        FindingLlmAuditResult? body = await findingLlmAudit.BuildAsync(runId, findingId, ct);

        if (body is null)
            return this.NotFoundProblem(
                $"Finding '{findingId}' on run '{runId}' has no resolvable agent execution trace in the current scope.",
                ProblemTypes.ResourceNotFound);

        return Ok(body);
    }
}
