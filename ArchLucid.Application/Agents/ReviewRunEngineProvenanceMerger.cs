using ArchLucid.Contracts.Runs;

namespace ArchLucid.Application.Agents;

/// <summary>Merges selection-time provenance with post-execute aggregation (TB-2106).</summary>
public static class ReviewRunEngineProvenanceMerger
{
    public static ReviewRunEngineProvenance MergeSelectionWithExecution(
        ReviewRunEngineProvenance? selection,
        ReviewRunEngineProvenance execution)
    {
        ArgumentNullException.ThrowIfNull(execution);

        if (selection is null)
        {
            return execution;
        }

        execution.ModelAliasId = selection.ModelAliasId;
        execution.TaskEvaluationSnapshotsAtSelection = selection.TaskEvaluationSnapshotsAtSelection;

        return execution;
    }
}
