IF COL_LENGTH(N'dbo.RunExportBlobPushOutbox', N'RequestedByDirectoryUserId') IS NOT NULL
    ALTER TABLE dbo.RunExportBlobPushOutbox DROP COLUMN RequestedByDirectoryUserId;
GO
IF COL_LENGTH(N'dbo.RunExportBlobPushOutbox', N'RequestedByActorKey') IS NOT NULL
    ALTER TABLE dbo.RunExportBlobPushOutbox DROP COLUMN RequestedByActorKey;
GO
