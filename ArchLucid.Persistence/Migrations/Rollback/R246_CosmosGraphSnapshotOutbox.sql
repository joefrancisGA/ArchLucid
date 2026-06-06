IF OBJECT_ID(N'dbo.CosmosGraphSnapshotOutbox', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.CosmosGraphSnapshotOutbox;
END;
GO
