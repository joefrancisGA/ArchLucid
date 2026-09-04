using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Decisioning.Decisions;
using ArchLucid.Contracts.Manifest;

namespace ArchLucid.Decisioning.Merge;

public sealed partial class AgentProposalManifestMerger
{
    private static void MergeRelationships(
        GoldenManifest manifest,
        IReadOnlyCollection<ManifestRelationship> relationships,
        DecisionMergeResult output,
        AgentType agentType)
    {
        // Compound key encodes source, target (OrdinalIgnoreCase via the HashSet comparer), and
        // relationship type as an int so enum renames cannot produce silent mismatches.
        HashSet<string> existingKeys = new(StringComparer.OrdinalIgnoreCase);

        // ReSharper disable once LoopCanBeConvertedToQuery — side effect (HashSet population) prevents safe LINQ conversion.

        foreach (ManifestRelationship r in manifest.Relationships)
            existingKeys.Add(RelationshipKey(r));

        // ReSharper disable once LoopCanBeConvertedToQuery — side effects (trace recording, list and HashSet mutation) prevent safe LINQ conversion.

        foreach (ManifestRelationship relationship in relationships)
        {

            if (string.IsNullOrWhiteSpace(relationship.SourceId) || string.IsNullOrWhiteSpace(relationship.TargetId))
            {
                output.Warnings.Add($"Skipped relationship with blank SourceId or TargetId from {agentType}.");
                continue;
            }

            if (!existingKeys.Add(RelationshipKey(relationship)))
                continue;

            manifest.Relationships.Add(CloneRelationship(relationship));

            DecisionMergeTraceRecorder.AddTrace(
                output,
                manifest.RunId,
                "RelationshipAdded",
                $"Added relationship '{relationship.RelationshipType}' from '{relationship.SourceId}' to '{relationship.TargetId}'.",
                new Dictionary<string, string>
                {
                    ["sourceId"] = relationship.SourceId,
                    ["targetId"] = relationship.TargetId,
                    ["relationshipType"] = relationship.RelationshipType.ToString(),
                    ["agentType"] = agentType.ToString()
                });
        }
    }

    /// <summary>
    ///     Produces a stable, case-insensitive compound key for a relationship used by the merge deduplication HashSet.
    ///     The relationship type is encoded as its underlying integer so enum renames cannot silently change equality.
    /// </summary>
    private static string RelationshipKey(ManifestRelationship r) =>
        $"{r.SourceId}|{r.TargetId}|{(int)r.RelationshipType}";
}
