using ArchLucid.Core.Manifest;
using ArchLucid.Core.Manifest.Sections;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.GoldenManifests;

internal static partial class GoldenManifestPhase1RelationalRead
{
    private static async Task<ManifestProvenance> LoadProvenanceRelationalAsync(
        SqlConnection connection,
        Guid manifestId,
        int provFindingCount,
        int provNodeCount,
        int provRuleCount,
        string? provenanceJson,
        CancellationToken ct)
    {
        int totalProvCount = provFindingCount + provNodeCount + provRuleCount;

        if (totalProvCount > 0)
        {
            List<string> sourceFindings = provFindingCount > 0
                ? await LoadOrderedStringsAsync(
                    connection,
                    """
                    SELECT FindingId AS Item
                    FROM dbo.GoldenManifestProvenanceSourceFindings
                    WHERE ManifestId = @ManifestId
                    ORDER BY SortOrder;
                    """,
                    manifestId,
                    ct)
                : [];

            List<string> sourceNodes = provNodeCount > 0
                ? await LoadOrderedStringsAsync(
                    connection,
                    """
                    SELECT NodeId AS Item
                    FROM dbo.GoldenManifestProvenanceSourceGraphNodes
                    WHERE ManifestId = @ManifestId
                    ORDER BY SortOrder;
                    """,
                    manifestId,
                    ct)
                : [];

            List<string> appliedRules = provRuleCount > 0
                ? await LoadOrderedStringsAsync(
                    connection,
                    """
                    SELECT RuleId AS Item
                    FROM dbo.GoldenManifestProvenanceAppliedRules
                    WHERE ManifestId = @ManifestId
                    ORDER BY SortOrder;
                    """,
                    manifestId,
                    ct)
                : [];

            return new ManifestProvenance { SourceFindingIds = sourceFindings, SourceGraphNodeIds = sourceNodes, AppliedRuleIds = appliedRules };
        }

        return FallbackDeserializeProvenance(provenanceJson);
    }
}
