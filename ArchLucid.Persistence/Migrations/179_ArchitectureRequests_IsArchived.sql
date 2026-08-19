/*
  Add IsArchived column to dbo.ArchitectureRequests table to allow users to archive old requests.
*/

IF OBJECT_ID(N'dbo.ArchitectureRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.ArchitectureRequests', N'IsArchived') IS NULL
BEGIN
    ALTER TABLE dbo.ArchitectureRequests
        ADD IsArchived BIT NOT NULL CONSTRAINT DF_ArchitectureRequests_IsArchived DEFAULT (0);
END;
GO
