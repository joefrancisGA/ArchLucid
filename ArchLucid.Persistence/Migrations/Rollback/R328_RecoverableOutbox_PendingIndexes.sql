/* Rollback for migration 328: restore pre-328 pending indexes on recoverable outboxes. */

DECLARE @Tables TABLE (TableName sysname NOT NULL);

INSERT INTO @Tables (TableName)
VALUES
    (N'RetrievalIndexingOutbox'),
    (N'AuthorityPipelineWorkOutbox'),
    (N'CosmosGraphSnapshotOutbox'),
    (N'RunExportBlobPushOutbox'),
    (N'PostCommitProjectionOutbox');

DECLARE @TableName sysname;
DECLARE table_cursor CURSOR LOCAL FAST_FORWARD FOR SELECT TableName FROM @Tables;

OPEN table_cursor;
FETCH NEXT FROM table_cursor INTO @TableName;

WHILE @@FETCH_STATUS = 0
BEGIN
    DECLARE @PendingIndex sysname = N'IX_' + @TableName + N'_Pending';
    DECLARE @RetryIndex sysname = N'IX_' + @TableName + N'_PendingWithRetries';
    DECLARE @QualifiedTable nvarchar(300) = N'dbo.' + QUOTENAME(@TableName);
    DECLARE @ObjectId int = OBJECT_ID(@QualifiedTable);

    IF @ObjectId IS NOT NULL
    BEGIN
        IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = @RetryIndex AND object_id = @ObjectId)
            EXEC (N'DROP INDEX ' + QUOTENAME(@RetryIndex) + N' ON ' + @QualifiedTable);

        IF EXISTS (SELECT 1 FROM sys.indexes WHERE name = @PendingIndex AND object_id = @ObjectId)
            EXEC (N'DROP INDEX ' + QUOTENAME(@PendingIndex) + N' ON ' + @QualifiedTable);

        IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = @PendingIndex AND object_id = @ObjectId)
            EXEC (
                N'CREATE NONCLUSTERED INDEX ' + QUOTENAME(@PendingIndex) +
                N' ON ' + @QualifiedTable + N' (ProcessedUtc, CreatedUtc) ' +
                N'WHERE ProcessedUtc IS NULL');
    END;

    FETCH NEXT FROM table_cursor INTO @TableName;
END;

CLOSE table_cursor;
DEALLOCATE table_cursor;
GO
