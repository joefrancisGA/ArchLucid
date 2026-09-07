using ArchLucid.Contracts.Architecture;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.Decisioning.Services.Findings;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Decisioning.Services;

public sealed class FindingsOrchestrator(
    IFindingsPolicyStampStage policyStampStage,
    IFindingsEngineInvokeStage engineInvokeStage,
    IFindingsInsightGeneratorStage insightGeneratorStage,
    IFindingsMergeAndGateStage mergeAndGateStage,
    IFindingsChecklistClusterStage checklistClusterStage,
    IFindingsSnapshotEmitStage snapshotEmitStage) : IFindingsOrchestrator
{
    private readonly IFindingsPolicyStampStage _policyStampStage =
        policyStampStage ?? throw new ArgumentNullException(nameof(policyStampStage));

    private readonly IFindingsEngineInvokeStage _engineInvokeStage =
        engineInvokeStage ?? throw new ArgumentNullException(nameof(engineInvokeStage));

    private readonly IFindingsInsightGeneratorStage _insightGeneratorStage =
        insightGeneratorStage ?? throw new ArgumentNullException(nameof(insightGeneratorStage));

    private readonly IFindingsMergeAndGateStage _mergeAndGateStage =
        mergeAndGateStage ?? throw new ArgumentNullException(nameof(mergeAndGateStage));

    private readonly IFindingsChecklistClusterStage _checklistClusterStage =
        checklistClusterStage ?? throw new ArgumentNullException(nameof(checklistClusterStage));

    private readonly IFindingsSnapshotEmitStage _snapshotEmitStage =
        snapshotEmitStage ?? throw new ArgumentNullException(nameof(snapshotEmitStage));

    public async Task<FindingsSnapshot> GenerateFindingsSnapshotAsync(
        Guid runId,
        Guid contextSnapshotId,
        GraphSnapshot graphSnapshot,
        CancellationToken ct,
        FindingAnalysisContext? analysisContext = null)
    {
        ArgumentNullException.ThrowIfNull(graphSnapshot);

        if (analysisContext is not null)
            FindingAnalysisContextGraphStamp.Stamp(graphSnapshot, analysisContext);

        FindingsStageContext context = new()
        {
            RunId = runId,
            ContextSnapshotId = contextSnapshotId,
            GraphSnapshot = graphSnapshot,
            AnalysisContext = analysisContext,
        };

        await _policyStampStage.ExecuteAsync(context, ct);
        await _engineInvokeStage.ExecuteAsync(context, ct);
        await _insightGeneratorStage.ExecuteAsync(context, ct);
        await _mergeAndGateStage.ExecuteAsync(context, ct);
        await _checklistClusterStage.ExecuteAsync(context, ct);

        return await _snapshotEmitStage.ExecuteAsync(context, ct);
    }
}
