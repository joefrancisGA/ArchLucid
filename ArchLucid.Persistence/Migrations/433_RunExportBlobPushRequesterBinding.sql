-- Forward-only requester binding. Legacy outbox rows are intentionally not updated.
IF COL_LENGTH(N'dbo.RunExportBlobPushOutbox', N'RequestedByActorKey') IS NULL
    ALTER TABLE dbo.RunExportBlobPushOutbox ADD RequestedByActorKey NVARCHAR(96) NULL;
GO
IF COL_LENGTH(N'dbo.RunExportBlobPushOutbox', N'RequestedByDirectoryUserId') IS NULL
    ALTER TABLE dbo.RunExportBlobPushOutbox ADD RequestedByDirectoryUserId UNIQUEIDENTIFIER NULL;
GO
