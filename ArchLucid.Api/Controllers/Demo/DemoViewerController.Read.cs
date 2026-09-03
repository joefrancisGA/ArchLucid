using ArchLucid.Api.Contracts;
using ArchLucid.Api.Mapping;
using ArchLucid.Api.Models;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Api.Support;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Demo;

using Microsoft.AspNetCore.Mvc;

namespace ArchLucid.Api.Controllers.Demo;

public sealed partial class DemoViewerController
{
    /// <summary>Run aggregate (same shape as <c>GET /v1/architecture/review/{runId}</c>).</summary>
    [HttpGet("runs/{runId}")]
    [ProducesResponseType(typeof(RunDetailsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRun(string runId, CancellationToken cancellationToken)
    {
        if (!IsViewerAllowed())
            return Unauthorized();

        using IDisposable _ = AmbientScopeContext.Push(DemoScopes.BuildDemoScope());

        ArchitectureRunDetail? detail = await runDetailQueryService.GetRunDetailForOperatorEnrichAsync(runId, cancellationToken);

        if (detail is null)
            return this.NotFoundProblem($"Run '{runId}' was not found (or is out of scope).", ProblemTypes.RunNotFound);

        if (!string.IsNullOrWhiteSpace(detail.Run.CurrentManifestVersion) && detail.Manifest is null)
            return this.NotFoundProblem($"Manifest for run '{runId}' was not found.", ProblemTypes.ManifestNotFound);

        RunDetailsResponse response = RunResponseMapper.ToRunDetailsResponse(
            detail.Run,
            detail.Tasks,
            detail.Results,
            detail.Manifest,
            detail.DecisionTraces);

        response.AuthorityPipelineComplete = detail.AuthorityPipelineComplete;
        response.AgentTaskLoopComplete = detail.AgentTaskLoopComplete;

        response.ExecutionFlavorBuyerSummary = RunExecutionFlavorSummary.Build(
            detail.Run,
            effectiveAgentExecutionModeAccessor.GetEffectiveMode());

        if (detail.IsCommitted)
        {
            response.TrustEvidenceCard = await trustEvidenceCardBuilder.BuildAsync(
                detail,
                effectiveAgentExecutionModeAccessor.GetEffectiveMode(),
                cancellationToken);
        }

        await RunAgentExecutionLlmCostEstimateAppender.AppendAsync(
            response,
            runId,
            DemoScopes.BuildDemoScope(),
            agentExecutionTraceRepository,
            llmCostEstimator,
            cancellationToken);

        return Ok(response);
    }

    /// <summary>Provenance graph for one run (same payload as <c>GET /v1/architecture/reviews/{runId}/provenance</c>).</summary>
    [HttpGet("runs/{runId}/graph")]
    [ProducesResponseType(typeof(ArchitectureRunProvenanceGraph), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetGraph(string runId, CancellationToken cancellationToken)
    {
        if (!IsViewerAllowed())
            return Unauthorized();

        using IDisposable _ = AmbientScopeContext.Push(DemoScopes.BuildDemoScope());

        ArchitectureRunProvenanceGraph? graph =
            await architectureRunProvenanceService.GetProvenanceAsync(runId, cancellationToken);

        return graph is null
            ? this.NotFoundProblem($"Provenance graph for run '{runId}' was not found.", ProblemTypes.ResourceNotFound)
            : Ok(graph);
    }
}
