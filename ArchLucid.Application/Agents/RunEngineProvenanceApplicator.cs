using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Agents;
using ArchLucid.Persistence.Models;

namespace ArchLucid.Application.Agents;

/// <summary>
///     Applies review-engine provenance to a run header before authority pipeline finalization seals anchors (TB-310).
/// </summary>
public static class RunEngineProvenanceApplicator
{
    public static void TryApplyFromEffectiveAliasId(
        RunRecord run,
        string? effectiveModelAliasId,
        IAgentModelAliasRegistry aliasRegistry)
    {
        ArgumentNullException.ThrowIfNull(run);
        ArgumentNullException.ThrowIfNull(aliasRegistry);

        if (string.IsNullOrWhiteSpace(effectiveModelAliasId))
            return;

        if (!aliasRegistry.TryGet(effectiveModelAliasId, out AgentModelAliasRegistryEntry? aliasEntry)
            || aliasEntry is null)
        {
            return;
        }

        ReviewRunEngineProvenance selectionProvenance = ReviewRunEngineSelectionProvenanceBuilder.Build(
            effectiveModelAliasId,
            aliasEntry,
            run.CreatedUtc);

        run.EngineProvenanceJson = ReviewRunEngineProvenanceJson.Serialize(selectionProvenance);
    }
}
