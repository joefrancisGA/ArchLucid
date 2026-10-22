using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.GoldenManifests;

internal static partial class GoldenManifestPhase1RelationalRead
{
    private static async Task<List<string>> LoadAssumptionsRelationalAsync(
        SqlConnection connection,
        Guid manifestId,
        CancellationToken ct) =>
        await LoadOrderedStringsAsync(
            connection,
            """
            SELECT AssumptionText AS Item
            FROM dbo.GoldenManifestAssumptions
            WHERE ManifestId = @ManifestId
            ORDER BY SortOrder;
            """,
            manifestId,
            ct);

    private static async Task<List<string>> LoadWarningsRelationalAsync(
        SqlConnection connection,
        Guid manifestId,
        CancellationToken ct) =>
        await LoadOrderedStringsAsync(
            connection,
            """
            SELECT WarningText AS Item
            FROM dbo.GoldenManifestWarnings
            WHERE ManifestId = @ManifestId
            ORDER BY SortOrder;
            """,
            manifestId,
            ct);

    private static async Task<ManifestSliceCounts> LoadSliceCountsAsync(
        SqlConnection connection,
        Guid manifestId,
        CancellationToken ct)
    {
        // Single round-trip avoids parallel commands on one connection (MARS is off in production pools).
        const string sql = """
                           SELECT
                               (SELECT COUNT(1) FROM dbo.GoldenManifestAssumptions WHERE ManifestId = @ManifestId) AS AssumptionsCount,
                               (SELECT COUNT(1) FROM dbo.GoldenManifestWarnings WHERE ManifestId = @ManifestId) AS WarningsCount,
                               (SELECT COUNT(1) FROM dbo.GoldenManifestDecisions WHERE ManifestId = @ManifestId) AS DecisionsCount,
                               (SELECT COUNT(1) FROM dbo.GoldenManifestProvenanceSourceFindings WHERE ManifestId = @ManifestId) AS ProvenanceFindingCount,
                               (SELECT COUNT(1) FROM dbo.GoldenManifestProvenanceSourceGraphNodes WHERE ManifestId = @ManifestId) AS ProvenanceNodeCount,
                               (SELECT COUNT(1) FROM dbo.GoldenManifestProvenanceAppliedRules WHERE ManifestId = @ManifestId) AS ProvenanceRuleCount;
                           """;

        ManifestSliceCounts counts = await connection.QuerySingleAsync<ManifestSliceCounts>(
            new CommandDefinition(sql, new { ManifestId = manifestId }, cancellationToken: ct)).ConfigureAwait(false);

        return counts;
    }

    private sealed record ManifestSliceCounts(
        int AssumptionsCount,
        int WarningsCount,
        int DecisionsCount,
        int ProvenanceFindingCount,
        int ProvenanceNodeCount,
        int ProvenanceRuleCount);
}
