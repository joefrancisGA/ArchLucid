using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Logging;

namespace ArchLucid.Persistence.Coordination.Backfill;

/// <summary>
///     Runs aggregate read-only SQL queries to determine per-slice relational coverage.
///     Uses set-based <c>COUNT / WHERE EXISTS</c> correlated subqueries — no row-by-row iteration.
/// </summary>
[ExcludeFromCodeCoverage(Justification =
    "Entirely SQL-dependent; every method runs Dapper queries against live SQL Server.")]
public sealed class SqlCutoverReadinessService(
    ISqlConnectionFactory connectionFactory,
    ILogger<SqlCutoverReadinessService> logger) : ICutoverReadinessService
{
    private static readonly string BatchSql = BuildBatchSql();

    public async Task<CutoverReadinessReport> AssessAsync(CancellationToken ct)
    {
        logger.LogInformation("Cutover readiness assessment starting.");

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(ct);

        await using SqlMapper.GridReader multi = await connection.QueryMultipleAsync(
            new CommandDefinition(BatchSql, cancellationToken: ct));

        List<CutoverSliceReadiness> slices =
        [
            .. await ReadContextSnapshotSlicesAsync(multi),
            .. await ReadGraphSnapshotSlicesAsync(multi),
            .. await ReadFindingsSnapshotSlicesAsync(multi),
            .. await ReadGoldenManifestSlicesAsync(multi),
            .. await ReadArtifactBundleSlicesAsync(multi)
        ];

        CutoverReadinessReport report = new() { Slices = slices };

        logger.LogInformation(
            "Cutover readiness assessment complete. TotalSlices={SliceCount}, Ready={ReadyCount}, NotReady={NotReadyCount}",
            slices.Count,
            slices.Count(static s => s.IsReady),
            report.SlicesNotReady.Count);

        return report;
    }

    private static async Task<IEnumerable<CutoverSliceReadiness>> ReadContextSnapshotSlicesAsync(SqlMapper.GridReader multi)
    {
        int totalHeaders = await ReadCountAsync(multi);

        return
        [
            Slice("ContextSnapshot.CanonicalObjects", totalHeaders, await ReadCountAsync(multi)),
            Slice("ContextSnapshot.Warnings", totalHeaders, await ReadCountAsync(multi)),
            Slice("ContextSnapshot.Errors", totalHeaders, await ReadCountAsync(multi)),
            Slice("ContextSnapshot.SourceHashes", totalHeaders, await ReadCountAsync(multi))
        ];
    }

    private static async Task<IEnumerable<CutoverSliceReadiness>> ReadGraphSnapshotSlicesAsync(SqlMapper.GridReader multi)
    {
        int totalHeaders = await ReadCountAsync(multi);

        return
        [
            Slice("GraphSnapshot.Nodes", totalHeaders, await ReadCountAsync(multi)),
            Slice("GraphSnapshot.Edges", totalHeaders, await ReadCountAsync(multi)),
            Slice("GraphSnapshot.Warnings", totalHeaders, await ReadCountAsync(multi)),
            Slice("GraphSnapshot.EdgeProperties", totalHeaders, await ReadCountAsync(multi))
        ];
    }

    private static async Task<IEnumerable<CutoverSliceReadiness>> ReadFindingsSnapshotSlicesAsync(SqlMapper.GridReader multi)
    {
        int totalHeaders = await ReadCountAsync(multi);

        return [Slice("FindingsSnapshot.Findings", totalHeaders, await ReadCountAsync(multi))];
    }

    private static async Task<IEnumerable<CutoverSliceReadiness>> ReadGoldenManifestSlicesAsync(SqlMapper.GridReader multi)
    {
        int totalHeaders = await ReadCountAsync(multi);

        return
        [
            Slice("GoldenManifest.Assumptions", totalHeaders, await ReadCountAsync(multi)),
            Slice("GoldenManifest.Warnings", totalHeaders, await ReadCountAsync(multi)),
            Slice("GoldenManifest.Decisions", totalHeaders, await ReadCountAsync(multi)),
            Slice("GoldenManifest.Provenance", totalHeaders, await ReadCountAsync(multi))
        ];
    }

    private static async Task<IEnumerable<CutoverSliceReadiness>> ReadArtifactBundleSlicesAsync(SqlMapper.GridReader multi)
    {
        int totalHeaders = await ReadCountAsync(multi);

        return [Slice("ArtifactBundle.Artifacts", totalHeaders, await ReadCountAsync(multi))];
    }

    private static async Task<int> ReadCountAsync(SqlMapper.GridReader multi) =>
        await multi.ReadSingleAsync<int>();

    private static CutoverSliceReadiness Slice(string sliceName, int totalHeaders, int headersWithChildren) =>
        new()
        {
            SliceName = sliceName,
            TotalHeaderRows = totalHeaders,
            HeadersWithRelationalRows = headersWithChildren
        };

    private static string BuildBatchSql()
    {
        string[] statements =
        [
            "SELECT COUNT(1) FROM dbo.ContextSnapshots;",
            CountHeadersWithChildrenSql("ContextSnapshots", "SnapshotId", "ContextSnapshotCanonicalObjects", "SnapshotId"),
            CountHeadersWithChildrenSql("ContextSnapshots", "SnapshotId", "ContextSnapshotWarnings", "SnapshotId"),
            CountHeadersWithChildrenSql("ContextSnapshots", "SnapshotId", "ContextSnapshotErrors", "SnapshotId"),
            CountHeadersWithChildrenSql("ContextSnapshots", "SnapshotId", "ContextSnapshotSourceHashes", "SnapshotId"),
            "SELECT COUNT(1) FROM dbo.GraphSnapshots;",
            CountHeadersWithChildrenSql("GraphSnapshots", "GraphSnapshotId", "GraphSnapshotNodes", "GraphSnapshotId"),
            CountHeadersWithChildrenSql("GraphSnapshots", "GraphSnapshotId", "GraphSnapshotEdges", "GraphSnapshotId"),
            CountHeadersWithChildrenSql("GraphSnapshots", "GraphSnapshotId", "GraphSnapshotWarnings", "GraphSnapshotId"),
            CountHeadersWithChildrenSql("GraphSnapshots", "GraphSnapshotId", "GraphSnapshotEdgeProperties", "GraphSnapshotId"),
            "SELECT COUNT(1) FROM dbo.FindingsSnapshots;",
            CountHeadersWithChildrenSql("FindingsSnapshots", "FindingsSnapshotId", "FindingRecords", "FindingsSnapshotId"),
            "SELECT COUNT(1) FROM dbo.GoldenManifests;",
            CountHeadersWithChildrenSql("GoldenManifests", "ManifestId", "GoldenManifestAssumptions", "ManifestId"),
            CountHeadersWithChildrenSql("GoldenManifests", "ManifestId", "GoldenManifestWarnings", "ManifestId"),
            CountHeadersWithChildrenSql("GoldenManifests", "ManifestId", "GoldenManifestDecisions", "ManifestId"),
            CountHeadersWithAnyProvenanceChildSql(),
            "SELECT COUNT(1) FROM dbo.ArtifactBundles;",
            CountHeadersWithChildrenSql("ArtifactBundles", "BundleId", "ArtifactBundleArtifacts", "BundleId")
        ];

        return string.Join("\n", statements);
    }

    /// <summary>
    ///     Builds a SQL statement that counts how many header rows have at least one child row
    ///     in the specified child table, using a <c>WHERE EXISTS</c> correlated subquery.
    /// </summary>
    private static string CountHeadersWithChildrenSql(
        string headerTable, string headerKey, string childTable, string childKey)
    {
        return $"""
                SELECT COUNT(1)
                FROM dbo.{headerTable} h
                WHERE EXISTS (
                    SELECT 1 FROM dbo.{childTable} c WHERE c.{childKey} = h.{headerKey}
                );
                """;
    }

    /// <summary>
    ///     Provenance is spread across three child tables; a header is "covered" when it has
    ///     at least one row in <em>any</em> of the three.
    /// </summary>
    private static string CountHeadersWithAnyProvenanceChildSql()
    {
        return """
               SELECT COUNT(1)
               FROM dbo.GoldenManifests h
               WHERE EXISTS (
                   SELECT 1 FROM dbo.GoldenManifestProvenanceSourceFindings c WHERE c.ManifestId = h.ManifestId
               )
               OR EXISTS (
                   SELECT 1 FROM dbo.GoldenManifestProvenanceSourceGraphNodes c WHERE c.ManifestId = h.ManifestId
               )
               OR EXISTS (
                   SELECT 1 FROM dbo.GoldenManifestProvenanceAppliedRules c WHERE c.ManifestId = h.ManifestId
               );
               """;
    }
}
