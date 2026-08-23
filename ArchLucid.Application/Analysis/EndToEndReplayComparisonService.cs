using ArchLucid.Application.Diffs;
using ArchLucid.Application.Findings;
using ArchLucid.Contracts.Agents;
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
public sealed class EndToEndReplayComparisonService(
    IRunDetailQueryService runDetailQueryService,
    IRunRepository runRepository,
    IRunExportRecordRepository runExportRecordRepository,
    IAgentResultDiffService agentResultDiffService,
    IManifestDiffService manifestDiffService,
    IExportRecordDiffService exportRecordDiffService,
    ICrossReviewFindingCorrelationService crossReviewFindingCorrelationService,
    ICrossReviewFindingLifecycleService crossReviewFindingLifecycleService,
    IArchitectureIntelligencePersistence architectureIntelligencePersistence,
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

    private readonly IArchitectureIntelligencePersistence _architectureIntelligencePersistence =
        architectureIntelligencePersistence ?? throw new ArgumentNullException(nameof(architectureIntelligencePersistence));

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
        if (!string.IsNullOrWhiteSpace(leftRun.CurrentManifestVersion) && !string.IsNullOrWhiteSpace(rightRun.CurrentManifestVersion))
            if (leftDetail.Manifest is not null && rightDetail.Manifest is not null)
                report.ManifestDiff = manifestDiffService.Compare(leftDetail.Manifest, rightDetail.Manifest);
            else
                report.Warnings.Add("One or both manifests were unavailable for manifest comparison.");
        IReadOnlyList<RunExportRecord> leftExports = await runExportRecordRepository.GetByRunIdAsync(leftRunId, cancellationToken);
        IReadOnlyList<RunExportRecord> rightExports = await runExportRecordRepository.GetByRunIdAsync(rightRunId, cancellationToken);
        // Match by ExportType so that ordering differences between runs don't produce nonsensical diffs.
        Dictionary<string, RunExportRecord> leftByType = leftExports.GroupBy(e => e.ExportType, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);
        Dictionary<string, RunExportRecord> rightByType = rightExports.GroupBy(e => e.ExportType, StringComparer.OrdinalIgnoreCase)
            .ToDictionary(g => g.Key, g => g.First(), StringComparer.OrdinalIgnoreCase);
        foreach (string exportType in leftByType.Keys.Union(rightByType.Keys, StringComparer.OrdinalIgnoreCase)
                     .OrderBy(t => t, StringComparer.OrdinalIgnoreCase))
        {
            bool hasLeft = leftByType.TryGetValue(exportType, out RunExportRecord? leftRecord);
            bool hasRight = rightByType.TryGetValue(exportType, out RunExportRecord? rightRecord);
            if (hasLeft && hasRight)
                report.ExportDiffs.Add(await exportRecordDiffService.CompareAsync(leftRecord!, rightRecord!, cancellationToken));
            else if (!hasLeft)
                report.Warnings.Add($"Export type '{exportType}' exists on the right run but not the left.");
            else
                report.Warnings.Add($"Export type '{exportType}' exists on the left run but not the right.");
        }

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

    private async Task AddCompareQualityDeltaAsync(
        EndToEndReplayComparisonReport report,
        string leftRunId,
        string rightRunId,
        IReadOnlyList<ArchitectureFinding> leftFindings,
        IReadOnlyList<ArchitectureFinding> rightFindings,
        CancellationToken cancellationToken)
    {
        ScopeContext scope = _scopeContextProvider.GetCurrentScope();
        string tenantId = scope.TenantId.ToString();
        ArchitectureKnowledgeModel? leftModel =
            await _architectureIntelligencePersistence.GetModelByRunIdAsync(tenantId, leftRunId, cancellationToken);
        ArchitectureKnowledgeModel? rightModel =
            await _architectureIntelligencePersistence.GetModelByRunIdAsync(tenantId, rightRunId, cancellationToken);

        CompareQualityDeltaCounts? delta = CompareQualityDeltaCalculator.Build(
            leftModel,
            leftFindings,
            rightModel,
            rightFindings);

        if (delta is null)
        {
            report.Warnings.Add(
                "Compare quality delta omitted because one or both architecture knowledge models were unavailable.");
            return;
        }

        report.CompareQualityDelta = delta;
    }

    /// <summary>
    ///     TB-2194: places each correlated finding on the lifecycle spine so the comparison can say which prior findings
    ///     were actually confirmed remediated rather than merely absent from the newer review.
    /// </summary>
    private async Task AddFindingLifecycleAsync(
        EndToEndReplayComparisonReport report,
        ArchitectureRun leftRun,
        IReadOnlyList<ArchitectureFinding> leftFindings,
        IReadOnlyList<ArchitectureFinding> rightFindings,
        IReadOnlyCollection<AgentResult> leftResults,
        IReadOnlyCollection<AgentResult> rightResults,
        CrossReviewFindingCorrelationResult correlation,
        CancellationToken cancellationToken)
    {
        CrossReviewFindingLifecycleResult lifecycle = await _crossReviewFindingLifecycleService.BuildAsync(
            new CrossReviewFindingLifecycleRequest
            {
                TenantId = _scopeContextProvider.GetCurrentScope().TenantId,
                PriorFindings = leftFindings,
                CurrentFindings = rightFindings,
                Correlation = correlation,
                SourceCoverage = CrossReviewFindingSourceCoverageBuilder.FromAgentResults(leftResults, rightResults),
                DispositionsSinceUtc =
                    new DateTimeOffset(DateTime.SpecifyKind(leftRun.CreatedUtc, DateTimeKind.Utc)),
            },
            cancellationToken);

        report.FindingLifecycle = lifecycle.Summary;
        report.FindingLifecycleRecords = [.. lifecycle.Records];
    }

    private static List<ArchitectureFinding> CollectFindings(ArchitectureRunDetail detail)
    {
        ArgumentNullException.ThrowIfNull(detail);

        List<ArchitectureFinding> findings = [];

        foreach (AgentResult result in detail.Results)
            findings.AddRange(result.Findings);

        return findings;
    }

    private static RunMetadataDiffResult BuildRunDiff(
        ArchitectureRun leftRun,
        ArchitectureRun rightRun,
        ReviewRunEngineProvenance? leftEngineProvenance,
        ReviewRunEngineProvenance? rightEngineProvenance)
    {
        RunMetadataDiffResult result = new();
        AddIfChanged(result.ChangedFields, "RequestId", leftRun.RequestId, rightRun.RequestId);
        AddIfChanged(result.ChangedFields, "Status", leftRun.Status, rightRun.Status);
        AddIfChanged(result.ChangedFields, "CurrentManifestVersion", leftRun.CurrentManifestVersion, rightRun.CurrentManifestVersion);
        AddIfChanged(result.ChangedFields, "CompletedUtc", leftRun.CompletedUtc, rightRun.CompletedUtc);
        AddIfChanged(result.ChangedFields, "StructuralExecutionMode", leftRun.StructuralExecutionMode, rightRun.StructuralExecutionMode);
        AddIfChanged(
            result.ChangedFields,
            "ModelAliasId",
            leftEngineProvenance?.ModelAliasId,
            rightEngineProvenance?.ModelAliasId);
        result.RequestIdsDiffer = !string.Equals(leftRun.RequestId, rightRun.RequestId, StringComparison.OrdinalIgnoreCase);
        result.ManifestVersionsDiffer = !string.Equals(leftRun.CurrentManifestVersion, rightRun.CurrentManifestVersion, StringComparison.OrdinalIgnoreCase);
        result.StatusDiffers = !Equals(leftRun.Status, rightRun.Status);
        result.CompletionStateDiffers = !EqualityComparer<DateTime?>.Default.Equals(leftRun.CompletedUtc, rightRun.CompletedUtc);
        result.ExecutionModesDiffer = leftRun.StructuralExecutionMode != rightRun.StructuralExecutionMode;
        result.ModelAliasIdsDiffer = !string.Equals(
            leftEngineProvenance?.ModelAliasId,
            rightEngineProvenance?.ModelAliasId,
            StringComparison.OrdinalIgnoreCase);
        result.SharedNonRealExecutionMode =
            !result.ExecutionModesDiffer
            && leftRun.StructuralExecutionMode != StructuralExecutionMode.Real;
        return result;
    }

    private static void AddInterpretationNotes(
        EndToEndReplayComparisonReport report,
        ReviewRunEngineProvenance? leftEngineProvenance,
        ReviewRunEngineProvenance? rightEngineProvenance)
    {
        ArgumentNullException.ThrowIfNull(report);

        string? engineNote = BuildLeadingEngineInterpretationNote(
            report,
            leftEngineProvenance,
            rightEngineProvenance);

        if (engineNote is not null)
        {
            report.InterpretationNotes.Add(engineNote);
        }

        if (report.RunDiff.ExecutionModesDiffer)
        {
            report.InterpretationNotes.Add(
                "Structural execution mode differs between the two reviews — finding, cost, and narrative deltas may not be directly comparable. Confirm per-finding trust labels on inspect and export paths.");
        }
        else if (report.RunDiff.SharedNonRealExecutionMode)
        {
            report.InterpretationNotes.Add(
                "Both reviews used the same non-real structural execution mode — treat finding and cost deltas as directional only and confirm per-finding trust labels on inspect and export paths.");
        }

        if (report.AgentResultDiff is not null && report.ManifestDiff is not null)
        {
            bool agentChanged = report.AgentResultDiff.AgentDeltas.Any(d =>
                d.AddedClaims.Count > 0 || d.RemovedClaims.Count > 0 || d.AddedFindings.Count > 0 || d.RemovedFindings.Count > 0 ||
                d.AddedRequiredControls.Count > 0 || d.RemovedRequiredControls.Count > 0 || d.AddedWarnings.Count > 0 || d.RemovedWarnings.Count > 0);
            bool manifestChanged = report.ManifestDiff.AddedServices.Count > 0 || report.ManifestDiff.RemovedServices.Count > 0 ||
                                   report.ManifestDiff.AddedDatastores.Count > 0 || report.ManifestDiff.RemovedDatastores.Count > 0 ||
                                   report.ManifestDiff.AddedRequiredControls.Count > 0 || report.ManifestDiff.RemovedRequiredControls.Count > 0 ||
                                   report.ManifestDiff.AddedRelationships.Count > 0 || report.ManifestDiff.RemovedRelationships.Count > 0;
            if (agentChanged && manifestChanged)
                report.InterpretationNotes.Add(
                    "Both agent outputs and resolved manifest changed, suggesting upstream proposal drift propagated into architecture state.");
            else if (!agentChanged && manifestChanged)
                report.InterpretationNotes.Add(
                    "The manifest changed without meaningful agent drift, which suggests merge logic or manifest ancestry differences.");
            else if (agentChanged && !manifestChanged)
                report.InterpretationNotes.Add(
                    "Agent outputs changed, but the resolved manifest remained stable, suggesting merge logic absorbed or normalized the drift.");
            else
                report.InterpretationNotes.Add("Neither agent outputs nor manifest changed materially.");
        }

        if (report.ExportDiffs.Any(d => d.ChangedTopLevelFields.Count > 0 || d.RequestDiff.ChangedFlags.Count > 0 || d.RequestDiff.ChangedValues.Count > 0))
            report.InterpretationNotes.Add(
                "Export configuration differences were detected, so document outputs may differ even when architecture state is similar.");
    }

    private static string? BuildLeadingEngineInterpretationNote(
        EndToEndReplayComparisonReport report,
        ReviewRunEngineProvenance? leftEngineProvenance,
        ReviewRunEngineProvenance? rightEngineProvenance)
    {
        ArgumentNullException.ThrowIfNull(report);

        bool modelAliasIdsDiffer = report.RunDiff.ModelAliasIdsDiffer;
        bool notEvaluated = HasNotEvaluatedSnapshot(leftEngineProvenance)
            || HasNotEvaluatedSnapshot(rightEngineProvenance);

        if (!modelAliasIdsDiffer && !notEvaluated)
        {
            return null;
        }

        List<string> parts = [];

        if (modelAliasIdsDiffer)
        {
            parts.Add(
                "Catalog model alias differs between the two reviews — attribute finding and narrative drift to engine selection before inferring architecture or policy changes.");
        }

        if (notEvaluated)
        {
            parts.Add(
                "At least one review recorded a task evaluation state of NotEvaluated at selection — hash equality does not imply the catalog engine was evaluated.");
        }

        return string.Join(' ', parts);
    }

    private static bool HasNotEvaluatedSnapshot(ReviewRunEngineProvenance? provenance)
    {
        if (provenance?.TaskEvaluationSnapshotsAtSelection is null)
        {
            return false;
        }

        return provenance.TaskEvaluationSnapshotsAtSelection.Any(snapshot =>
            snapshot is not null
            && string.Equals(snapshot.EvaluationState, "NotEvaluated", StringComparison.OrdinalIgnoreCase));
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

    private static void AddIfChanged<T>(List<string> target, string fieldName, T left, T right)
    {
        if (!EqualityComparer<T>.Default.Equals(left, right))
            target.Add(fieldName);
    }
}
