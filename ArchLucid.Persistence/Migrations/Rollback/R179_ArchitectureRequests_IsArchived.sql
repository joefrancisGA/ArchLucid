/*
  Roll back DbUp 179 — remove ArchitectureRequests.IsArchived.
*/

IF COL_LENGTH(N'dbo.ArchitectureRequests', N'IsArchived') IS NOT NULL
BEGIN
    ALTER TABLE dbo.ArchitectureRequests DROP CONSTRAINT IF EXISTS DF_ArchitectureRequests_IsArchived;
    ALTER TABLE dbo.ArchitectureRequests DROP COLUMN IsArchived;
END;
GO
