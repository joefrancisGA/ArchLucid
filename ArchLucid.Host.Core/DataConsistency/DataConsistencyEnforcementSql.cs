namespace ArchLucid.Host.Core.DataConsistency;

/// <summary>Inserts orphan scoped rows into quarantine (idempotent on <c>SourceRowKey</c> per table).</summary>
internal static class DataConsistencyEnforcementSql
{
    /// <summary>
    ///     Round-robin selection across <c>TenantId</c> using <c>ROW_NUMBER()</c> so one noisy tenant cannot consume the
    ///     entire batch cap.
    /// </summary>
    public const string InsertOrphanGoldenManifestsMissingRun = """
                                                                INSERT INTO dbo.DataConsistencyQuarantine (QuarantineId, TenantId, SourceTable, SourceColumn, SourceRowKey, DetectedUtc, ReasonJson)
                                                                SELECT TOP (@MaxRows)
                                                                    NEWID() AS QuarantineId,
                                                                    rr.TenantId,
                                                                    N'GoldenManifests' AS SourceTable,
                                                                    N'RunId' AS SourceColumn,
                                                                    rr.SourceRowKey,
                                                                    SYSUTCDATETIME() AS DetectedUtc,
                                                                    N'{"kind":"orphan_missing_run"}' AS ReasonJson
                                                                FROM (
                                                                    SELECT
                                                                        g.ManifestId,
                                                                        g.TenantId,
                                                                        CAST(g.ManifestId AS NVARCHAR(36)) AS SourceRowKey,
                                                                        ROW_NUMBER() OVER (PARTITION BY g.TenantId ORDER BY g.CreatedUtc ASC, g.ManifestId ASC)
                                                                            AS tenantRoundRobin
                                                                    FROM dbo.GoldenManifests g
                                                                    WHERE NOT EXISTS (
                                                                        SELECT 1 FROM dbo.Runs r WHERE r.RunId = g.RunId)
                                                                      AND NOT EXISTS (
                                                                        SELECT 1
                                                                        FROM dbo.DataConsistencyQuarantine q
                                                                        WHERE q.SourceTable = N'GoldenManifests'
                                                                          AND q.SourceColumn = N'RunId'
                                                                          AND q.SourceRowKey = CAST(g.ManifestId AS NVARCHAR(36)))
                                                                ) rr
                                                                ORDER BY rr.tenantRoundRobin ASC, rr.TenantId ASC;
                                                                """;

    /// <summary>
    ///     Orphan <c>FindingsSnapshots</c> rows whose <c>RunId</c> has no <c>dbo.Runs</c> parent — same batching pattern as
    ///     golden manifests. <c>TenantId</c> may be null on legacy rows; quarantine requires NOT NULL, so unknown tenant maps
    ///     to the nil GUID (operators reconcile separately).
    /// </summary>
    public const string InsertOrphanFindingsSnapshotsMissingRun = """
                                                                  INSERT INTO dbo.DataConsistencyQuarantine (QuarantineId, TenantId, SourceTable, SourceColumn, SourceRowKey, DetectedUtc, ReasonJson)
                                                                  SELECT TOP (@MaxRows)
                                                                      NEWID() AS QuarantineId,
                                                                      rr.TenantId,
                                                                      N'FindingsSnapshots' AS SourceTable,
                                                                      N'RunId' AS SourceColumn,
                                                                      rr.SourceRowKey,
                                                                      SYSUTCDATETIME() AS DetectedUtc,
                                                                      N'{"kind":"orphan_missing_run"}' AS ReasonJson
                                                                  FROM (
                                                                      SELECT
                                                                          f.FindingsSnapshotId,
                                                                          COALESCE(f.TenantId, CAST('00000000-0000-0000-0000-000000000000' AS UNIQUEIDENTIFIER)) AS TenantId,
                                                                          CAST(f.FindingsSnapshotId AS NVARCHAR(36)) AS SourceRowKey,
                                                                          ROW_NUMBER() OVER (PARTITION BY COALESCE(f.TenantId, CAST('00000000-0000-0000-0000-000000000000' AS UNIQUEIDENTIFIER)) ORDER BY f.CreatedUtc ASC, f.FindingsSnapshotId ASC)
                                                                              AS tenantRoundRobin
                                                                      FROM dbo.FindingsSnapshots f
                                                                      WHERE NOT EXISTS (
                                                                          SELECT 1 FROM dbo.Runs r WHERE r.RunId = f.RunId)
                                                                        AND NOT EXISTS (
                                                                          SELECT 1
                                                                          FROM dbo.DataConsistencyQuarantine q
                                                                          WHERE q.SourceTable = N'FindingsSnapshots'
                                                                            AND q.SourceColumn = N'RunId'
                                                                            AND q.SourceRowKey = CAST(f.FindingsSnapshotId AS NVARCHAR(36)))
                                                                  ) rr
                                                                  ORDER BY rr.tenantRoundRobin ASC, rr.TenantId ASC;
                                                                  """;
}
