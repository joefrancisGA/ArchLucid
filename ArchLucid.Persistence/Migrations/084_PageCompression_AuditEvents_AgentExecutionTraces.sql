/*
  084: Rowstore PAGE compression on high-churn append-mostly tables (Azure SQL: smaller storage, fewer logical reads).

  Idempotent: rebuilds only when any enabled rowstore index partition is not already PAGE.
  Rebuilds rowstore indexes individually (not ALTER INDEX ALL) so nonclustered columnstore indexes
  from migration 217 are not touched with invalid PAGE compression.
  Tier: requires a SKU that supports data compression (vCore / DTU Standard+; not Basic). Validate with
  sp_estimate_data_compression_savings in pre-prod before production apply.

  Targets: dbo.AuditEvents (DataJson + scope indexes), dbo.AgentExecutionTraces (TraceJson + inline/blob columns + indexes).
*/

IF OBJECT_ID(N'dbo.AuditEvents', N'U') IS NOT NULL
BEGIN
    DECLARE @AuditEventsPendingRowstoreIndexes TABLE (IndexName SYSNAME NOT NULL PRIMARY KEY);
    DECLARE @AuditEventsIndexName SYSNAME;
    DECLARE @AuditEventsSql NVARCHAR(MAX);

    INSERT INTO @AuditEventsPendingRowstoreIndexes (IndexName)
    SELECT DISTINCT i.name
    FROM sys.indexes AS i
    INNER JOIN sys.partitions AS p
        ON p.object_id = i.object_id AND p.index_id = i.index_id
    WHERE i.object_id = OBJECT_ID(N'dbo.AuditEvents')
      AND i.is_disabled = 0
      AND i.type IN (0, 1, 2)
      AND p.data_compression_desc <> N'PAGE';

    WHILE EXISTS (SELECT 1 FROM @AuditEventsPendingRowstoreIndexes)
    BEGIN
        SELECT TOP (1) @AuditEventsIndexName = IndexName FROM @AuditEventsPendingRowstoreIndexes;

        SET @AuditEventsSql = N'ALTER INDEX ' + QUOTENAME(@AuditEventsIndexName)
            + N' ON dbo.AuditEvents REBUILD WITH (DATA_COMPRESSION = PAGE, SORT_IN_TEMPDB = ON);';
        EXEC sp_executesql @AuditEventsSql;

        DELETE FROM @AuditEventsPendingRowstoreIndexes WHERE IndexName = @AuditEventsIndexName;
    END;
END;
GO

IF OBJECT_ID(N'dbo.AgentExecutionTraces', N'U') IS NOT NULL
   AND EXISTS (
        SELECT 1
        FROM sys.indexes AS i
        INNER JOIN sys.partitions AS p
            ON p.object_id = i.object_id AND p.index_id = i.index_id
        WHERE i.object_id = OBJECT_ID(N'dbo.AgentExecutionTraces')
          AND i.is_disabled = 0
          AND i.type IN (0, 1, 2)
          AND p.data_compression_desc <> N'PAGE')
BEGIN
    ALTER INDEX ALL ON dbo.AgentExecutionTraces REBUILD WITH (DATA_COMPRESSION = PAGE, SORT_IN_TEMPDB = ON);
END;
GO
