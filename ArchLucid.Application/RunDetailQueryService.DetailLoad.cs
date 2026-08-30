using ArchLucid.Application.Findings;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Mapping;
using ArchLucid.Contracts.Agents;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.DecisionTraces;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Core.Diagnostics;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Models;
using ArchLucid.Application.Agents;

using Microsoft.Extensions.Logging;

namespace ArchLucid.Application;

public sealed partial class RunDetailQueryService
{
    private async Task<ArchitectureRunDetail?> LoadRunDetailAsync(
        string runId,
        bool useRollupProjection,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        if (!TryParseRunGuid(runId, out Guid runGuid))
        {
            if (logger.IsEnabled(LogLevel.Debug))
                logger.LogDebug("RunDetailQueryService: run '{RunId}' is not a valid run identifier.", LogSanitizer.Sanitize(runId));
            return null;
        }

        ScopeContext scope = scopeContextProvider.GetCurrentScope();
        RunRecord? record = await runRepository.GetByIdAsync(scope, runGuid, cancellationToken).ConfigureAwait(false);

        if (record is null)
        {
            if (logger.IsEnabled(LogLevel.Debug))
                logger.LogDebug("RunDetailQueryService: run '{RunId}' not found.", LogSanitizer.Sanitize(runId));
            return null;
        }

        Task<IReadOnlyList<AgentTask>> tasksTask =
            taskRepository.GetByRunIdAsync(scope, runId, cancellationToken);
        Task<IReadOnlyList<AgentResult>> resultsTask = useRollupProjection
            ? resultRepository.GetRollupProjectionByRunIdAsync(scope, runId, cancellationToken)
            : resultRepository.GetByRunIdAsync(scope, runId, cancellationToken);
        Task<GoldenManifest?> manifestTask =
            unifiedGoldenManifestReader.ReadByRunIdAsync(scope, runGuid, cancellationToken);
        Task<IReadOnlyList<AgentExecutionTraceLlmCostSlice>> costSlicesTask =
            _agentExecutionTraceRepository.GetLlmCostSlicesByRunIdAsync(scope, runId, cancellationToken);

        Task<IReadOnlyDictionary<string, FindingMuteFlag>> muteFlagsTask =
            record.FindingsSnapshotId is { } findingsSnapshotId
                ? findingRecordMuteRepository.GetMuteFlagsAsync(findingsSnapshotId, scope, cancellationToken)
                : Task.FromResult<IReadOnlyDictionary<string, FindingMuteFlag>>(
                    new Dictionary<string, FindingMuteFlag>(StringComparer.Ordinal));

        Task<DecisionTraceDto?> authorityTraceTask = record.DecisionTraceId is { } authorityTraceId
            ? authorityDecisionTraceRepository.GetByIdAsync(scope, authorityTraceId, cancellationToken)
            : Task.FromResult<DecisionTraceDto?>(null);

        Task<IReadOnlyList<StageTimelineSummary>> stageOutcomesTask =
            _runStageOutcomesRepository.ListByRunIdAsync(runGuid, cancellationToken);

        await Task.WhenAll(
                tasksTask,
                resultsTask,
                manifestTask,
                costSlicesTask,
                muteFlagsTask,
                authorityTraceTask,
                stageOutcomesTask)
            .ConfigureAwait(false);

        IReadOnlyList<AgentTask> tasks = await tasksTask.ConfigureAwait(false);
        ArchitectureRun run = RunRecordToArchitectureRunMapper.ToArchitectureRun(record, tasks.Select(t => t.TaskId).ToList());
        List<AgentResult> results = (await resultsTask.ConfigureAwait(false)).ToList();

        IReadOnlyDictionary<string, FindingMuteFlag> muteFlags = await muteFlagsTask.ConfigureAwait(false);

        if (muteFlags.Count > 0)
        {
            FindingMuteFlagApplier.Apply(results, muteFlags);
        }

        FindingTrustLabelEnricher.Apply(run, results, _findingTrustLabelMapper);

        GoldenManifest? manifest = await manifestTask.ConfigureAwait(false);
        List<DecisionTraceDto> decisionTraces = [];

        if (manifest is null)
        {
            if (!string.IsNullOrWhiteSpace(run.CurrentManifestVersion) && logger.IsEnabled(LogLevel.Warning))
                logger.LogWarning("RunDetailQueryService: run '{RunId}' references manifest version '{Version}' which no longer exists.",
                    LogSanitizer.Sanitize(runId), LogSanitizer.Sanitize(run.CurrentManifestVersion));
        }
        else
        {
            DecisionTraceDto? authorityTrace = await authorityTraceTask.ConfigureAwait(false);

            if (authorityTrace is not null)
                decisionTraces = [authorityTrace];
        }

        IReadOnlyList<StageTimelineSummary> stageOutcomes = await stageOutcomesTask.ConfigureAwait(false);
        IReadOnlyList<AgentExecutionTraceLlmCostSlice> costSlices = await costSlicesTask.ConfigureAwait(false);
        ArchLucid.Contracts.Runs.RunAgentLlmCostEstimateDto? costEstimate = null;

        if (costSlices.Count > 0)
        {
            AgentExecutionTraceRunLlmCostSummary costSummary =
                AgentExecutionTraceRunLlmCostAggregator.Compute(costSlices, _llmCostEstimator);
            costEstimate = new ArchLucid.Contracts.Runs.RunAgentLlmCostEstimateDto
            {
                EstimatedCostUsd = costSummary.EstimatedCostUsd,
                TokenCounts = new ArchLucid.Contracts.Runs.RunLlmTokenCountsDto
                {
                    Prompt = costSummary.PromptTokens,
                    Completion = costSummary.CompletionTokens
                },
                Model = costSummary.ModelLabel,
                CostEstimationBasis = costSummary.CostEstimationBasis
            };
        }

        return new ArchitectureRunDetail
        {
            Run = run,
            Tasks = tasks.ToList(),
            Results = results,
            Manifest = manifest,
            DecisionTraces = decisionTraces,
            AgentExecutionLlmCostEstimate = costEstimate,
            HasBrokenManifestReference = !string.IsNullOrWhiteSpace(run.CurrentManifestVersion) && manifest is null,
            AuthorityPipelineComplete = RunKernelCompleteness.IsAuthorityPipelineComplete(
                run.GoldenManifestId,
                manifest,
                stageOutcomes),
            AgentTaskLoopComplete = RunKernelCompleteness.IsAgentTaskLoopComplete(
                _runStateTransitionService,
                run.Status,
                results)
        };
    }

    private static bool TryParseRunGuid(string runId, out Guid runGuid)
    {
        return Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
    }
}
