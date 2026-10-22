using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
///     Strips full κ payloads from an improve-loop diff so the hot accept path returns entries only.
/// </summary>
public static class ArchitectureModelDiffPayloadSlimmer
{
    public static ArchitectureModelDiff WithoutModels(ArchitectureModelDiff diff)
    {
        ArgumentNullException.ThrowIfNull(diff);

        return new ArchitectureModelDiff
        {
            RecommendationId = diff.RecommendationId,
            Entries = diff.Entries ?? [],
            BeforeModel = diff.BeforeModel is null
                ? new ArchitectureKnowledgeModel()
                : ArchitectureKnowledgeModelCloner.Clone(diff.BeforeModel),
            AfterModel = new ArchitectureKnowledgeModel(),
        };
    }
}
