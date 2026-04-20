namespace ArchLucid.Host.Core.DataConsistency;

/// <summary>Inserts orphan <c>dbo.GoldenManifests</c> rows into quarantine (idempotent on <c>SourceRowKey</c>).</summary>
internal static class DataConsistencyEnforcementSql
{
    public const string InsertOrphanGoldenManifestsMissingRun = """
        INSERT INTO dbo.DataConsistencyQuarantine (QuarantineId, TenantId, SourceTable, SourceColumn, SourceRowKey, DetectedUtc, ReasonJson)
        SELECT TOP (@MaxRows)
            NEWID() AS QuarantineId,
            g.TenantId,
            N'GoldenManifests' AS SourceTable,
            N'RunId' AS SourceColumn,
            CAST(g.ManifestId AS NVARCHAR(36)) AS SourceRowKey,
            SYSUTCDATETIME() AS DetectedUtc,
            N'{"kind":"orphan_missing_run"}' AS ReasonJson
        FROM dbo.GoldenManifests g
        WHERE NOT EXISTS (
            SELECT 1 FROM dbo.Runs r WHERE r.RunId = g.RunId)
          AND NOT EXISTS (
            SELECT 1
            FROM dbo.DataConsistencyQuarantine q
            WHERE q.SourceTable = N'GoldenManifests'
              AND q.SourceColumn = N'RunId'
              AND q.SourceRowKey = CAST(g.ManifestId AS NVARCHAR(36)));
        """;
}
