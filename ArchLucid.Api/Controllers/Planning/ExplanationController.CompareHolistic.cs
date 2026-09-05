using ArchLucid.Api.Attributes;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Explanation.Models;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Comparison;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Scoping;

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
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> ExplainComparison(
        [FromQuery] Guid baseRunId,
        [FromQuery] Guid targetRunId,
        CancellationToken ct = default)
    {
        ManifestCompareLoadResult loadResult =
            await compareRunsFacade.CompareManifestsAsync(baseRunId, targetRunId, ct);

        return loadResult.Outcome switch
        {
            ManifestCompareLoadOutcome.Success => Ok(
                await explanation.ExplainComparisonAsync(loadResult.Comparison!, ct)),
            ManifestCompareLoadOutcome.BaseRunNotFound => this.NotFoundProblem(
                $"Run '{loadResult.RunId}' was not found.",
                ProblemTypes.RunNotFound),
            ManifestCompareLoadOutcome.TargetRunNotFound => this.NotFoundProblem(
                $"Run '{loadResult.RunId}' was not found.",
                ProblemTypes.RunNotFound),
            ManifestCompareLoadOutcome.BaseManifestNotFound => this.NotFoundProblem(
                $"Run '{loadResult.RunId}' does not have a committed golden manifest.",
                ProblemTypes.ManifestNotFound),
            ManifestCompareLoadOutcome.TargetManifestNotFound => this.NotFoundProblem(
                $"Run '{loadResult.RunId}' does not have a committed golden manifest.",
                ProblemTypes.ManifestNotFound),
            ManifestCompareLoadOutcome.BaseLifecycleIncomplete => this.ConflictProblem(
                $"Run '{loadResult.RunId}' authority lifecycle must be Complete before compare.",
                ProblemTypes.Conflict),
            ManifestCompareLoadOutcome.TargetLifecycleIncomplete => this.ConflictProblem(
                $"Run '{loadResult.RunId}' authority lifecycle must be Complete before compare.",
                ProblemTypes.Conflict),
            ManifestCompareLoadOutcome.PinFingerprintMismatch => this.ConflictProblem(
                "Compare blocked: create-time pin fingerprints differ between the selected runs.",
                ProblemTypes.Conflict),
            ManifestCompareLoadOutcome.CommittedArtifactInventoryMismatch => this.ConflictProblem(
                "Compare blocked: committed artifact inventory fingerprints differ between the selected runs.",
                ProblemTypes.CommittedArtifactInventoryMismatch),
            ManifestCompareLoadOutcome.SealedManifestHashMismatch => this.ConflictProblem(
                "Compare blocked: sealed manifest hash verification failed for one or both selected runs.",
                ProblemTypes.Conflict),
            _ => throw new InvalidOperationException($"Unexpected manifest compare outcome: {loadResult.Outcome}."),
        };
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
