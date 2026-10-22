namespace ArchLucid.Host.Core.DataConsistency;

/// <summary>
///     SQL fragments for TB-311 committed run header FK repoint detection (dangling or cross-run child links).
/// </summary>
public static class CommittedRunHeaderFkRepointProbeSql
{
    /// <summary>
    ///     Committed runs whose <c>ContextSnapshotId</c> is missing or owned by another run.
    /// </summary>
    public const string ContextSnapshotId = """
                                            SELECT COUNT_BIG(1)
                                            FROM dbo.Runs r
                                            WHERE r.GoldenManifestId IS NOT NULL
                                              AND r.ContextSnapshotId IS NOT NULL
                                              AND NOT EXISTS (
                                                  SELECT 1
                                                  FROM dbo.ContextSnapshots c
                                                  WHERE c.SnapshotId = r.ContextSnapshotId
                                                    AND c.RunId = r.RunId);
                                            """;

    /// <summary>
    ///     Committed runs whose <c>GraphSnapshotId</c> is missing or owned by another run.
    /// </summary>
    public const string GraphSnapshotId = """
                                          SELECT COUNT_BIG(1)
                                          FROM dbo.Runs r
                                          WHERE r.GoldenManifestId IS NOT NULL
                                            AND r.GraphSnapshotId IS NOT NULL
                                            AND NOT EXISTS (
                                                SELECT 1
                                                FROM dbo.GraphSnapshots g
                                                WHERE g.GraphSnapshotId = r.GraphSnapshotId
                                                  AND g.RunId = r.RunId);
                                          """;

    /// <summary>
    ///     Committed runs whose <c>FindingsSnapshotId</c> is missing or owned by another run.
    /// </summary>
    public const string FindingsSnapshotId = """
                                             SELECT COUNT_BIG(1)
                                             FROM dbo.Runs r
                                             WHERE r.GoldenManifestId IS NOT NULL
                                               AND r.FindingsSnapshotId IS NOT NULL
                                               AND NOT EXISTS (
                                                   SELECT 1
                                                   FROM dbo.FindingsSnapshots f
                                                   WHERE f.FindingsSnapshotId = r.FindingsSnapshotId
                                                     AND f.RunId = r.RunId);
                                             """;

    /// <summary>
    ///     Committed runs whose <c>GoldenManifestId</c> is missing or owned by another run.
    /// </summary>
    public const string GoldenManifestId = """
                                           SELECT COUNT_BIG(1)
                                           FROM dbo.Runs r
                                           WHERE r.GoldenManifestId IS NOT NULL
                                             AND NOT EXISTS (
                                                 SELECT 1
                                                 FROM dbo.GoldenManifests g
                                                 WHERE g.ManifestId = r.GoldenManifestId
                                                   AND g.RunId = r.RunId);
                                           """;

    /// <summary>
    ///     Committed runs whose <c>DecisionTraceId</c> is missing or owned by another run.
    /// </summary>
    public const string DecisionTraceId = """
                                          SELECT COUNT_BIG(1)
                                          FROM dbo.Runs r
                                          WHERE r.GoldenManifestId IS NOT NULL
                                            AND r.DecisionTraceId IS NOT NULL
                                            AND NOT EXISTS (
                                                SELECT 1
                                                FROM dbo.DecisioningTraces d
                                                WHERE d.DecisionTraceId = r.DecisionTraceId
                                                  AND d.RunId = r.RunId);
                                          """;

    /// <summary>
    ///     Committed runs whose <c>ArtifactBundleId</c> is missing or owned by another run.
    /// </summary>
    public const string ArtifactBundleId = """
                                           SELECT COUNT_BIG(1)
                                           FROM dbo.Runs r
                                           WHERE r.GoldenManifestId IS NOT NULL
                                             AND r.ArtifactBundleId IS NOT NULL
                                             AND NOT EXISTS (
                                                 SELECT 1
                                                 FROM dbo.ArtifactBundles ab
                                                 WHERE ab.BundleId = r.ArtifactBundleId
                                                   AND ab.RunId = r.RunId);
                                           """;
}
