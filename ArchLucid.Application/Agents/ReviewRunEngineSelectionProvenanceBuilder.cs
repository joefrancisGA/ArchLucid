using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Agents;

namespace ArchLucid.Application.Agents;

/// <summary>Builds selection-time engine provenance before agent execute completes (TB-2106).</summary>
public static class ReviewRunEngineSelectionProvenanceBuilder
{
    public static ReviewRunEngineProvenance Build(
        string modelAliasId,
        AgentModelAliasRegistryEntry entry,
        DateTime runCreatedUtc)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(modelAliasId);
        ArgumentNullException.ThrowIfNull(entry);

        return new ReviewRunEngineProvenance
        {
            ModelAliasId = modelAliasId.Trim(),
            TaskEvaluationSnapshotsAtSelection = entry.TaskEvaluations
                .Select(
                    evaluation => new ReviewRunEngineTaskEvaluationSnapshot
                    {
                        TaskType = evaluation.TaskType,
                        EvaluationState = evaluation.EvaluationState.ToString(),
                        EvaluatedUtc = evaluation.EvaluatedUtc
                    })
                .OrderBy(snapshot => snapshot.TaskType, StringComparer.OrdinalIgnoreCase)
                .ToList(),
            RunTimestampUtc = runCreatedUtc
        };
    }
}
