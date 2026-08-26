using ArchLucid.Api.Contracts;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Support;
using ArchLucid.Application.Governance;
using ArchLucid.ArtifactSynthesis.Models;
using ArchLucid.Contracts.Governance;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Explanation;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Queries;
using ArchLucid.Provenance;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class AuthorityQueryController
{
    /// <summary>
    ///     Audit events associated with this run, oldest-first (pipeline / lifecycle visibility for operators).
    ///     Prefer <c>GET /v1/runs/{runId}/review-trail</c> (<see cref="AuthorityReadsController.GetReviewTrail" />).
    /// </summary>
    [Obsolete("Prefer GET /v1/runs/{runId}/review-trail. Retained for backward compatibility.")]
    [HttpGet("reviews/{runId:guid}/pipeline-timeline")]
    [HttpGet("reviews/{runId:guid}/review-trail")]
    [ProducesResponseType(typeof(IReadOnlyList<RunPipelineTimelineItemResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRunPipelineTimeline(Guid runId, CancellationToken ct = default)
    {
        IReadOnlyList<RunPipelineTimelineItemResponse>? items =
            await readHandlers.TryGetPipelineTimelineAsync(runId, ct);

        if (items is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        await readHandlers.LogRunScopedAuditAsync(AuditEventTypes.ReviewTrailAccessed, runId, null, ct);

        return Ok(items);
    }

    /// <summary>Unified decision rationale (authority or coordinator) for operator triage.</summary>
    /// <remarks>Prefer <c>GET /v1/runs/{runId}/review-trail/rationale</c>.</remarks>
    [Obsolete("Prefer GET /v1/runs/{runId}/review-trail/rationale. Retained for backward compatibility.")]
    [HttpGet("reviews/{runId:guid}/rationale")]
    [HttpGet("reviews/{runId:guid}/review-trail/rationale")]
    [ProducesResponseType(typeof(RunRationale), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetRunRationale(Guid runId, CancellationToken ct = default)
    {
        RunRationale? rationale = await readHandlers.GetRunRationaleAsync(runId, ct);

        return rationale is null
            ? this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound)
            : Ok(rationale);
    }

    /// <summary>Gets compact counts/metadata for a golden manifest in the current scope.</summary>
    /// <param name="manifestId">Manifest primary key.</param>
    /// <param name="ct">Cancellation token.</param>
    /// <returns><see cref="ManifestSummaryResponse" />, or 404 when unknown or out of scope.</returns>
    [HttpGet("signed-review-records/{manifestId:guid}/summary")]
    [ProducesResponseType(typeof(ManifestSummaryResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetManifestSummary(
        Guid manifestId,
        CancellationToken ct = default)
    {
        ScopeContext scope = scopeProvider.GetCurrentScope();
        ManifestSummaryDto? result = await queryService.GetManifestSummaryAsync(scope, manifestId, ct);

        if (result is null)
            return this.NotFoundProblem($"Manifest '{manifestId}' was not found.", ProblemTypes.ManifestNotFound);

        return Ok(new ManifestSummaryResponse
        {
            ManifestId = result.ManifestId,
            RunId = result.RunId,
            CreatedUtc = result.CreatedUtc,
            ManifestHash = result.ManifestHash,
            RuleSetId = result.RuleSetId,
            RuleSetVersion = result.RuleSetVersion,
            DecisionCount = result.DecisionCount,
            WarningCount = result.WarningCount,
            UnresolvedIssueCount = result.UnresolvedIssueCount,
            Status = result.Status,
            HasWarnings = result.WarningCount > 0,
            HasUnresolvedIssues = result.UnresolvedIssueCount > 0,
            OperatorSummary =
                $"{result.DecisionCount} decisions, {result.WarningCount} warnings, {result.UnresolvedIssueCount} unresolved issues, status {result.Status}",
            TopDecisionSynopses = result.TopDecisionSynopses,
            FeasibilityVerdict = result.FeasibilityVerdict,
            EffectiveGovernanceAtCommit = result.EffectiveGovernanceAtCommit,
            ReviewStandardsAtCommit = result.ReviewStandardsAtCommit
        });
    }

    /// <summary>
    ///     Returns a structural provenance graph (nodes + edges) linking graph, findings, rules, decisions, manifest, and
    ///     artifacts.
    /// </summary>
    /// <remarks>
    ///     Requires a completed authority pipeline; coordinator-only runs return 422. Prefer
    ///     <c>GET /v1/runs/{runId}/review-trail/provenance</c>.
    /// </remarks>
    [Obsolete("Prefer GET /v1/runs/{runId}/review-trail/provenance. Retained for backward compatibility.")]
    [HttpGet("reviews/{runId:guid}/provenance")]
    [HttpGet("reviews/{runId:guid}/review-trail/provenance")]
    [ProducesResponseType(typeof(DecisionProvenanceGraph), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> GetRunProvenance(Guid runId, CancellationToken ct = default)
    {
        (DecisionProvenanceGraph? graph, RunDetailDto? detail, string? unprocessableDetail) =
            await readHandlers.TryGetProvenanceGraphAsync(runId, ct);

        if (detail is null && graph is null && unprocessableDetail is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        if (unprocessableDetail is not null)
            return this.UnprocessableEntityProblem(unprocessableDetail);

        if (graph is null)
            return this.UnprocessableEntityProblem("Provenance graph could not be resolved for this run.");

        await readHandlers.LogRunScopedAuditAsync(AuditEventTypes.ProvenanceAccessed, runId, null, ct);

        return Ok(graph);
    }

    /// <summary>Returns the hydrated sealed review record JSON for the review when finalized.</summary>
    /// <remarks>Prefer <c>GET /v1/runs/{runId}/manifest</c> (<see cref="AuthorityReadsController.GetRunManifest" />).</remarks>
    [Obsolete("Prefer GET /v1/runs/{runId}/manifest. Retained for backward compatibility.")]
    [HttpGet("reviews/{runId:guid}/signed-review-record")]
    [ProducesResponseType(typeof(ManifestDocument), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetRunGoldenManifest(Guid runId, CancellationToken ct = default)
    {
        RunDetailDto? detail = await readHandlers.GetRunDetailAsync(runId, ct);

        if (detail is null)
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        if (detail.GoldenManifest is null)
            return this.NotFoundProblem(
                $"Golden manifest for run '{runId}' was not found.",
                ProblemTypes.ManifestNotFound);

        await readHandlers.LogRunScopedAuditAsync(
            AuditEventTypes.ManifestViewed,
            runId,
            detail.GoldenManifest.ManifestId,
            ct);

        return Ok(detail.GoldenManifest);
    }
}
