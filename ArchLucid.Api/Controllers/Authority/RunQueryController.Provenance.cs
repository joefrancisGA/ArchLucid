using ArchLucid.Api.Models;
using ArchLucid.Api.Models.Graph;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Services.Authority;
using ArchLucid.Application.Runs.Query;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Explanation;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.DevTesting;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Authority;

public sealed partial class RunQueryController
{
    /// <summary>Knowledge-graph snapshot packaged for interactive Cytoscape.js renders.</summary>
    [HttpGet("reviews/{runId}/graph/interactive")]
    [HttpGet("reviews/{runId}/graph/cytoscape")]
    [Produces("application/json")]
    [ProducesResponseType(typeof(CytoscapeInteractiveGraphResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetInteractiveGraphSnapshot(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        RunInteractiveGraphQueryResult result =
            await runGraphQueryService.GetInteractiveGraphSnapshotAsync(runId, cancellationToken);

        return result.Outcome switch
        {
            RunGraphQueryOutcome.Success => Ok(result.Response),
            RunGraphQueryOutcome.BadRequest => this.BadRequestProblem(result.ProblemDetail!, ProblemTypes.ValidationFailed),
            _ => this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.RunNotFound)
        };
    }

    /// <summary>
    ///     Returns the coordinator linkage graph (request, tasks, results, findings, manifest, traces, decisions) and a sorted
    ///     trace timeline.
    /// </summary>
    [HttpGet("reviews/{runId}/provenance")]
    [ProducesResponseType(typeof(ArchitectureRunProvenanceGraph), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetArchitectureRunProvenance(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        ArchitectureRunProvenanceGraph? graph =
            await runProvenanceQueryService.GetProvenanceAsync(runId, cancellationToken);

        return graph is null
            ? this.NotFoundProblem(
                $"Run '{runId}' was not found, or its manifest reference is broken.",
                ProblemTypes.RunNotFound)
            : Ok(graph);
    }

    /// <summary>
    ///     Per-node provenance explanations are not a supported surface (no stable per-node LLM contract). This route is
    ///     omitted from OpenAPI; callers should use <c>GET /v1/explain/runs/{{runId}}/aggregate</c>. Tenant scope is enforced
    ///     before the response.
    /// </summary>
    [ApiExplorerSettings(IgnoreApi = true)]
    [HttpGet("reviews/{runId}/provenance/{nodeId}/explanation")]
    [HttpGet("review/{runId}/provenance/{nodeId}/explanation")]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status501NotImplemented)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetProvenanceNodeExplanation(
        [FromRoute] string runId,
        [FromRoute] string nodeId,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(nodeId))
            return this.BadRequestProblem("Node id is required.", ProblemTypes.ValidationFailed);

        if (!await runProvenanceQueryService.AuthorityRunExistsInScopeAsync(runId, cancellationToken))
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        ProvenanceNodeExplanationQueryResult unsupported =
            runProvenanceQueryService.GetProvenanceNodeExplanationNotSupported();

        return this.NotImplementedProblem(
            unsupported.Detail,
            ProblemTypes.ProvenanceNodeExplanationNotSupported,
            "Provenance node explanation not supported",
            unsupported.Hints);
    }

    /// <summary>
    ///     Returns decision-tree nodes materialized for <paramref name="runId" /> after commit (empty before commit yields
    ///     404).
    /// </summary>
    [HttpGet("review/{runId}/decisions")]
    [ProducesResponseType(typeof(DecisionNodeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRunDecisions(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        RunDecisionsQueryResult result =
            await runProvenanceQueryService.GetRunDecisionsAsync(runId, cancellationToken);

        return result.Outcome == RunGraphQueryOutcome.Success
            ? Ok(result.Response)
            : this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.ResourceNotFound);
    }

    /// <summary>
    ///     Returns the hydrated <see cref="AgentEvidencePackage" /> used when agents ran for <paramref name="runId" />.
    /// </summary>
    [HttpGet("review/{runId}/evidence")]
    [ProducesResponseType(typeof(AgentEvidencePackageResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRunEvidence(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        RunEvidenceQueryResult result =
            await runProvenanceQueryService.GetRunEvidenceAsync(runId, cancellationToken);

        return result.Outcome == RunGraphQueryOutcome.Success
            ? Ok(result.Response)
            : this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.ResourceNotFound);
    }

    /// <summary>
    ///     Returns a page of <see cref="AgentExecutionTraceSummary" /> rows for <paramref name="runId" /> (no prompts or
    ///     raw model output — use <c>GET /v1/internal/architecture/traces/forensics/{traceId}</c> for full TraceJson).
    /// </summary>
    [HttpGet("review/{runId}/traces")]
    [ProducesResponseType(typeof(AgentExecutionTraceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRunTraces(
        [FromRoute] string runId,
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        RunTracesQueryResult result =
            await runProvenanceQueryService.GetRunTracesAsync(runId, pageNumber, pageSize, cancellationToken);

        return result.Outcome switch
        {
            RunGraphQueryOutcome.Success => Ok(result.Response),
            RunGraphQueryOutcome.BadRequest => this.BadRequestProblem(result.ProblemDetail!, ProblemTypes.ValidationFailed),
            _ => this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.RunNotFound)
        };
    }

    /// <summary>
    ///     Trace-derived redacted invocation forensics for operator review (TB-110). Not a structured MCP tool-call ledger.
    /// </summary>
    [HttpGet("review/{runId}/tool-invocation-forensics")]
    [Authorize(Policy = ArchLucidPolicies.RequireOperatorRole)]
    [ProducesResponseType(typeof(RunToolInvocationForensicsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRunToolInvocationForensics(
        [FromRoute] string runId,
        CancellationToken cancellationToken = default)
    {
        RunToolInvocationForensicsQueryResult result =
            await runProvenanceQueryService.GetRunToolInvocationForensicsAsync(runId, cancellationToken);

        return result.Outcome == RunGraphQueryOutcome.Success
            ? Ok(result.Response)
            : this.NotFoundProblem(result.ProblemDetail!, ProblemTypes.RunNotFound);
    }
}
