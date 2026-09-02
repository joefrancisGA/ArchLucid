using ArchLucid.Application.Diffs;
using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Agents;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Analysis;

/// <summary>
///     Builds a full <see cref = "EndToEndReplayComparisonReport"/> by loading both runs through
///     <see cref = "IRunDetailQueryService"/>, diffing agent results, manifests, and export records
///     side-by-side, and appending human-readable interpretation notes.
/// </summary>
/// <remarks>
///     Warnings are added to <see cref = "EndToEndReplayComparisonReport.Warnings"/> rather than
///     thrown when optional data (manifests, exports) is missing for one or both runs.
///     Throws <see cref = "RunNotFoundException"/> when either run cannot be resolved.
/// </remarks>
public sealed partial class EndToEndReplayComparisonService(
    IRunDetailQueryService runDetailQueryService,
    IRunRepository runRepository,
    IRunExportRecordRepository runExportRecordRepository,
    IAgentResultDiffService agentResultDiffService,
    IManifestDiffService manifestDiffService,
    IExportRecordDiffService exportRecordDiffService,
    ICrossReviewFindingCorrelationService crossReviewFindingCorrelationService,
    ICrossReviewFindingLifecycleService crossReviewFindingLifecycleService,
    IArchitectureKnowledgeModelAccess architectureKnowledgeModelAccess,
    IScopeContextProvider scopeContextProvider) : IEndToEndReplayComparisonService
{
    private readonly IRunDetailQueryService _runDetailQueryService = runDetailQueryService ?? throw new ArgumentNullException(nameof(runDetailQueryService));

    private readonly IRunRepository _runRepository =
        runRepository ?? throw new ArgumentNullException(nameof(runRepository));

    private readonly IRunExportRecordRepository _runExportRecordRepository =
        runExportRecordRepository ?? throw new ArgumentNullException(nameof(runExportRecordRepository));

    private readonly IExportRecordDiffService _exportRecordDiffService =
        exportRecordDiffService ?? throw new ArgumentNullException(nameof(exportRecordDiffService));

    private readonly IAgentResultDiffService
        _agentResultDiffService = agentResultDiffService ?? throw new ArgumentNullException(nameof(agentResultDiffService));

    private readonly IManifestDiffService _manifestDiffService = manifestDiffService ?? throw new ArgumentNullException(nameof(manifestDiffService));

    private readonly ICrossReviewFindingCorrelationService _crossReviewFindingCorrelationService =
        crossReviewFindingCorrelationService ?? throw new ArgumentNullException(nameof(crossReviewFindingCorrelationService));

    private readonly ICrossReviewFindingLifecycleService _crossReviewFindingLifecycleService =
        crossReviewFindingLifecycleService ?? throw new ArgumentNullException(nameof(crossReviewFindingLifecycleService));

    private readonly IArchitectureKnowledgeModelAccess _architectureKnowledgeModelAccess =
        architectureKnowledgeModelAccess ?? throw new ArgumentNullException(nameof(architectureKnowledgeModelAccess));

    private readonly IScopeContextProvider _scopeContextProvider =
        scopeContextProvider ?? throw new ArgumentNullException(nameof(scopeContextProvider));

    public async Task<EndToEndReplayComparisonReport> BuildAsync(string leftRunId, string rightRunId, CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(leftRunId);
        ArgumentNullException.ThrowIfNull(rightRunId);
        ArgumentException.ThrowIfNullOrWhiteSpace(leftRunId);
        ArgumentException.ThrowIfNullOrWhiteSpace(rightRunId);
        Task<ArchitectureRunDetail> leftDetailTask = LoadRunDetailForRollupOrThrow(leftRunId, cancellationToken);
        Task<ArchitectureRunDetail> rightDetailTask = LoadRunDetailForRollupOrThrow(rightRunId, cancellationToken);
        await Task.WhenAll(leftDetailTask, rightDetailTask);
        ArchitectureRunDetail leftDetail = await leftDetailTask;
        ArchitectureRunDetail rightDetail = await rightDetailTask;
        ArchitectureRun leftRun = leftDetail.Run;
        ArchitectureRun rightRun = rightDetail.Run;
        ReviewRunEngineProvenance? leftEngineProvenance =
            await TryLoadEngineProvenanceAsync(leftRunId, cancellationToken).ConfigureAwait(false);
        ReviewRunEngineProvenance? rightEngineProvenance =
            await TryLoadEngineProvenanceAsync(rightRunId, cancellationToken).ConfigureAwait(false);
        EndToEndReplayComparisonReport report = new()
        {
            LeftRunId = leftRunId,
            RightRunId = rightRunId,
            RunDiff = BuildRunDiff(leftRun, rightRun, leftEngineProvenance, rightEngineProvenance)
        };
        List<AgentResult> leftResults = leftDetail.Results;
        List<AgentResult> rightResults = rightDetail.Results;
        if (leftResults.Count > 0 || rightResults.Count > 0)
            report.AgentResultDiff = agentResultDiffService.Compare(leftRunId, leftResults, rightRunId, rightResults);
        else
            report.Warnings.Add("Neither run contained agent results.");
        if (leftDetail.Manifest is not null && rightDetail.Manifest is not null)
            report.ManifestDiff = manifestDiffService.Compare(leftDetail.Manifest, rightDetail.Manifest);
        else if (!string.IsNullOrWhiteSpace(leftRun.CurrentManifestVersion) || !string.IsNullOrWhiteSpace(rightRun.CurrentManifestVersion))
            report.Warnings.Add("One or both manifests were unavailable for manifest comparison.");
        IReadOnlyList<RunExportRecord> leftExports = await runExportRecordRepository.GetByRunIdAsync(leftRunId, cancellationToken);
        IReadOnlyList<RunExportRecord> rightExports = await runExportRecordRepository.GetByRunIdAsync(rightRunId, cancellationToken);
        await AddExportDiffsAsync(report, leftExports, rightExports, cancellationToken);

        AddInterpretationNotes(report, leftEngineProvenance, rightEngineProvenance);
        List<ArchitectureFinding> leftFindings = CollectFindings(leftDetail);
        List<ArchitectureFinding> rightFindings = CollectFindings(rightDetail);
        CrossReviewFindingCorrelationResult correlation = _crossReviewFindingCorrelationService.Correlate(
            leftFindings,
            rightFindings);
        report.FindingCorrelation = ComparisonFindingCorrelationMetadataBuilder.Build(correlation);
        await AddFindingLifecycleAsync(report, leftRun, leftFindings, rightFindings, leftResults, rightResults, correlation, cancellationToken);
        await AddCompareQualityDeltaAsync(
            report,
            leftRunId,
            rightRunId,
            leftFindings,
            rightFindings,
            cancellationToken);

        return report;
    }

    private async Task<ReviewRunEngineProvenance?> TryLoadEngineProvenanceAsync(
        string runId,
        CancellationToken cancellationToken)
    {
        if (!TryParseRunGuid(runId, out Guid runGuid))
        {
            return null;
        }

        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        RunRecord? header = await _runRepository.GetByIdAsync(scope, runGuid, cancellationToken).ConfigureAwait(false);

        return ReviewRunEngineProvenanceJson.TryDeserialize(header?.EngineProvenanceJson);
    }

    private async Task<ArchitectureKnowledgeModel?> TryLoadModelForRunAsync(
        ScopeContext scope,
        string runId,
        CancellationToken cancellationToken)
    {
        if (!TryParseRunGuid(runId, out Guid runGuid))
            return null;

        return await _architectureKnowledgeModelAccess
            .GetForRunAsync(scope, runGuid, cancellationToken)
            .ConfigureAwait(false);
    }

    private static bool TryParseRunGuid(string runId, out Guid runGuid)
    {
        return Guid.TryParseExact(runId, "N", out runGuid) || Guid.TryParse(runId, out runGuid);
    }

    private async Task<ArchitectureRunDetail> LoadRunDetailForRollupOrThrow(string runId, CancellationToken cancellationToken)
    {
        ArchitectureRunDetail? detail =
            await _runDetailQueryService.GetRunDetailForRollupAsync(runId, cancellationToken);

        return detail ?? throw new RunNotFoundException(runId);
    }
}
