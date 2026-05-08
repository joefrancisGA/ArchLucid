using ArchLucid.Api.Evaluation;
using ArchLucid.Api.ProblemDetails;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.Authorization;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using Asp.Versioning;

using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ArchLucid.Api.Controllers.Authority;

/// <summary>
///     On-demand structural and semantic evaluation of agent traces for a run.
/// </summary>
[ApiController]
[Authorize(Policy = ArchLucidPolicies.ReadAuthority)]
[ApiVersion("1.0")]
[Route("v{version:apiVersion}/internal/architecture")]
[EnableRateLimiting("fixed")]
[ProducesResponseType(StatusCodes.Status401Unauthorized)]
[ProducesResponseType(StatusCodes.Status403Forbidden)]
[ProducesResponseType(typeof(Microsoft.AspNetCore.Mvc.ProblemDetails), StatusCodes.Status429TooManyRequests)]
public sealed class RunAgentEvaluationController(
    IRunRepository authorityRunRepository,
    IAgentExecutionTraceRepository agentExecutionTraceRepository,
    IAgentEvidencePackageRepository agentEvidencePackageRepository,
    IAgentOutputEvaluator agentOutputEvaluator,
    IAgentOutputSemanticEvaluator agentOutputSemanticEvaluator,
    IAgentOutputQualityGate agentOutputQualityGate,
    IAgentResultEvidenceFaithfulnessChecker agentResultEvidenceFaithfulnessChecker,
    IAgentResultEmbeddingFaithfulnessScorer embeddingFaithfulnessScorer,
    IScopeContextProvider scopeContextProvider) : ControllerBase
{
    /// <summary>
    ///     On-demand structural and semantic evaluation of <see cref="AgentExecutionTrace.ParsedResultJson" /> for traces in
    ///     the run (no metrics).
    /// </summary>
    [HttpGet("run/{runId}/agent-evaluation")]
    [HttpGet("/v{version:apiVersion}/architecture/run/{runId}/agent-evaluation")]
    [ProducesResponseType(typeof(AgentOutputEvaluationSummary), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetRunAgentEvaluation(
        [FromRoute] string runId,
        CancellationToken cancellationToken)
    {
        if (!await AuthorityRunExistsInScopeAsync(runId, cancellationToken).ConfigureAwait(false))
            return this.NotFoundProblem($"Run '{runId}' was not found.", ProblemTypes.RunNotFound);

        IReadOnlyList<AgentExecutionTrace> traces =
            await agentExecutionTraceRepository.GetByRunIdAsync(runId, cancellationToken).ConfigureAwait(false);

        int skipped = traces.Count(static t =>
            !t.ParseSucceeded || string.IsNullOrEmpty(t.ParsedResultJson));

        AgentEvidencePackage? evidence =
            await agentEvidencePackageRepository.GetByRunIdAsync(runId, cancellationToken).ConfigureAwait(false);

        IEnumerable<AgentExecutionTrace> eligible = traces.Where(static t =>
            t.ParseSucceeded && !string.IsNullOrEmpty(t.ParsedResultJson));

        AgentOutputEvaluationScore[] evaluatedRows =
            await Task.WhenAll(
                    eligible.Select(
                        trace => EvaluateTraceRowAsync(trace, evidence, cancellationToken)))
                .ConfigureAwait(false);

        List<AgentOutputEvaluationScore> scores = [.. evaluatedRows];

        IEnumerable<double> ratiosForAverage =
            scores.Where(static s => !s.IsJsonParseFailure).Select(static s => s.StructuralCompletenessRatio);

        IEnumerable<double> semanticForAverage =
            scores.Where(static s => !s.IsJsonParseFailure && s.Semantic is not null)
                .Select(static s => s.Semantic!.OverallSemanticScore);

        double[] ratioArray = ratiosForAverage.ToArray();
        double[] semanticArray = semanticForAverage.ToArray();

        double? averageStructural =
            ratioArray.Length == 0 ? null : ratioArray.Average();

        double? averageSemantic =
            semanticArray.Length == 0 ? null : semanticArray.Average();

        AgentOutputEvaluationSummary summary = new()
        {
            RunId = runId,
            EvaluatedAtUtc = TimeProvider.System.GetUtcNow().UtcDateTime,
            Scores = scores,
            TracesSkippedCount = skipped,
            AverageStructuralCompletenessRatio = averageStructural,
            AverageSemanticScore = averageSemantic,
            AggregateQualityGateOutcome = AgentOutputEvaluationWorstGateAggregator.WorstOutcome(scores, agentOutputQualityGate),
        };

        return Ok(summary);
    }

    private async Task<AgentOutputEvaluationScore> EvaluateTraceRowAsync(
        AgentExecutionTrace trace,
        AgentEvidencePackage? evidence,
        CancellationToken cancellationToken)
    {
        AgentOutputEvaluationScore score =
            agentOutputEvaluator.Evaluate(trace.TraceId, trace.ParsedResultJson!, trace.AgentType);
        score.BlobUploadFailed = trace.BlobUploadFailed;
        score.QualityWarning = trace.QualityWarning;

        if (!score.IsJsonParseFailure)
        {
            score.Semantic =
                await agentOutputSemanticEvaluator.EvaluateAsync(trace.TraceId, trace.ParsedResultJson, trace.AgentType, cancellationToken)
                    .ConfigureAwait(false);

            if (evidence is not null)
            {
                AgentResultEvidenceFaithfulnessReport faithReport =
                    agentResultEvidenceFaithfulnessChecker.Evaluate(trace.ParsedResultJson!, evidence);

                score.Semantic.AgentResultFaithfulnessSupportRatio = faithReport.SupportRatio;

                double? emb =
                    await embeddingFaithfulnessScorer
                        .TryComputeMeanCosineAsync(trace.ParsedResultJson!, evidence, cancellationToken)
                        .ConfigureAwait(false);

                if (emb is double e)
                    score.Semantic.AgentResultEmbeddingFaithfulnessMeanCosine = e;
            }
        }

        return score;
    }

    private async Task<bool> AuthorityRunExistsInScopeAsync(string runId, CancellationToken cancellationToken)
    {
        if (!TryParseRunId(runId, out Guid runGuid))
            return false;

        ScopeContext scope = scopeContextProvider.GetCurrentScope();

        return await authorityRunRepository.GetByIdAsync(scope, runGuid, cancellationToken).ConfigureAwait(false)
               is not null;
    }

    private static bool TryParseRunId(string runId, out Guid runGuid)
    {
        return Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
    }
}
