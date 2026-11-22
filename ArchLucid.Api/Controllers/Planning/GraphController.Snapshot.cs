using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Security;
using ArchLucid.Application;
using ArchLucid.Application.Analysis;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Persistence.Graph;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Queries;
using ArchLucid.Provenance;

using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace ArchLucid.Api.Controllers.Planning;

public sealed partial class GraphController
{
    /// <summary>
    ///     Architecture graph reconstructed at <paramref name="asOf"/> from the anchored review’s authority project lineage
    ///     (latest committed run ≤ <paramref name="asOf"/> with a persisted graph snapshot).
    /// </summary>
    [HttpGet("snapshot")]
    [ProducesResponseType(typeof(ArchitectureGraphTemporalSnapshotResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status413PayloadTooLarge)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<IActionResult> GetArchitectureGraphTemporalSnapshot(
        [FromQuery] Guid runId,
        [FromQuery] DateTimeOffset? asOf,
        CancellationToken ct = default,
        [FromQuery] bool secureNowExchange = false)
    {
        try
        {
            // The optional exchange format is hidden unless a server-side feature gate explicitly enables it.
            // Resolve from DI fail-closed: absence of the provider must never enable the capability.
            if (secureNowExchange)
            {
                IFeatureFlags? flags = HttpContext.RequestServices.GetService<IFeatureFlags>();
                if (flags is null || !await flags.IsEnabledAsync("SecureNow.ReadOnlySnapshotExchange", ct))
                    return NotFound();
            }

            if (runId == Guid.Empty)
                return this.BadRequestProblem("Query parameter \"runId\" is required.");

            if (!asOf.HasValue)
                return this.BadRequestProblem("Query parameter \"asOf\" is required.");

            ScopeContext scope = scopeProvider.GetCurrentScope();

            // FND-010: authorize the SecureNow evidence exchange before any run/evidence read.
            // The requested run ID is the scoped anchor resource, not a claim that
            // the resolved graph snapshot has already been authorized.
            if (secureNowExchange)
            {
                EvidenceReadAuthorizationGate? gate =
                    HttpContext.RequestServices.GetService<EvidenceReadAuthorizationGate>();
                if (gate is null)
                    return NotFound();
                EvidenceReadDecision access = await gate.AuthorizeAsync(
                    User, scope.TenantId, scope.WorkspaceId, scope.ProjectId, runId, ct);
                if (!access.Allowed)
                    return NotFound();
            }

            RunRecord? anchor = await runRepository.GetByIdAsync(scope, runId, ct);

            if (anchor is null)
                return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

            DateTime boundaryUtc = DateTime.SpecifyKind(asOf.Value.UtcDateTime, DateTimeKind.Utc);

            RunRecord? resolved =
                await runRepository.GetLatestWithGraphAtOrBeforeAsync(scope, anchor.ProjectId, boundaryUtc, ct);

            if (resolved is null)
            {
                return this.NotFoundProblem(
                    $"No persisted architecture graph exists for project '{anchor.ProjectId}' at or before the requested instant.",
                    ProblemTypes.ResourceNotFound);
            }

            RunDetailDto? detail = await authorityQueryService.GetRunDetailAsync(scope, resolved.RunId, ct);

            if (detail is null)
                return this.NotFoundProblem($"Run '{resolved.RunId}' was not found.", ProblemTypes.RunNotFound);

            RunDetailDto? anchorCompareDetail =
                await authorityQueryService.GetRunDetailForManifestCompareAsync(scope, runId, ct);

            try
            {
                GraphSnapshotComparePinInventoryGuard.EnsureTemporalPairPinInventoryReadyOrThrow(
                    anchor,
                    resolved,
                    anchorCompareDetail?.GoldenManifest,
                    detail.GoldenManifest);
            }
            catch (ConflictException ex)
            {
                return MapGraphSealedManifestConflict(ex);
            }

            if (anchorCompareDetail?.GoldenManifest is not null)
            {
                IActionResult? anchorSealedGuardResult =
                    EnsureGoldenManifestSealedReadAllowed(anchorCompareDetail.GoldenManifest, runId);

                if (anchorSealedGuardResult is not null)
                    return anchorSealedGuardResult;
            }

            if (detail.GoldenManifest is not null)
            {
                IActionResult? resolvedSealedGuardResult =
                    EnsureGoldenManifestSealedReadAllowed(detail.GoldenManifest, resolved.RunId);

                if (resolvedSealedGuardResult is not null)
                    return resolvedSealedGuardResult;
            }

            if (detail.GraphSnapshot is null)
            {
                return this.NotFoundProblem(
                    $"Run '{resolved.RunId}' does not have a graph snapshot.",
                    ProblemTypes.ResourceNotFound);
            }

            KnowledgeGraphLimitsOptions limits = knowledgeGraphLimits.Value;

            if (limits.FullGraphResponseMaxNodes > 0 &&
                detail.GraphSnapshot.Nodes.Count > limits.FullGraphResponseMaxNodes)
            {
                return this.PayloadTooLargeProblem(
                    $"This graph has {detail.GraphSnapshot.Nodes.Count} nodes; the temporal snapshot endpoint allows at most "
                    + $"{limits.FullGraphResponseMaxNodes} for resolved run '{resolved.RunId:D}'. Use GET /v1/evidence-graph/reviews/{resolved.RunId:D}/nodes with page/pageSize (resolvedRunId returned in this problem).",
                    ProblemTypes.GraphTooLargeForFullResponse,
                    extensions: new Dictionary<string, object?> { ["resolvedRunId"] = resolved.RunId });
            }

            if (secureNowExchange)
            {
                try
                {
                    SecureNowSnapshotEnvelope exchange = SecureNowSnapshotProjection.Project(
                        detail.GraphSnapshot, scope, resolved.RunId, DateTimeOffset.UtcNow);
                    return Ok(exchange);
                }
                catch (ArgumentException)
                {
                    // A malformed persisted graph must not be exposed through the SecureNow exchange.
                    return Conflict();
                }
            }

            GraphViewModel graph = MapArchitectureGraph(detail.GraphSnapshot);
            ArchitectureGraphTemporalSnapshotResponse body = new()
            {
                ResolvedRunId = resolved.RunId,
                AsOfUtc = new DateTimeOffset(DateTime.SpecifyKind(boundaryUtc, DateTimeKind.Utc), TimeSpan.Zero),
                ResolvedRunCreatedUtc = DateTime.SpecifyKind(resolved.CreatedUtc.ToUniversalTime(), DateTimeKind.Utc),
                Graph = graph
            };

            return Ok(body);
        }
        catch (ConflictException ex)
        {
            return MapGraphSealedManifestConflict(ex);
        }
    }
}
