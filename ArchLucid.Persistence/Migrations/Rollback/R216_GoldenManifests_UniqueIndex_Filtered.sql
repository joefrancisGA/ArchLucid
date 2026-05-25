IF EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'UX_GoldenManifests_RunId_Active'
      AND object_id = OBJECT_ID(N'dbo.GoldenManifests'))
    DROP INDEX UX_GoldenManifests_RunId_Active ON dbo.GoldenManifests;
GO

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND NOT EXISTS (
       SELECT 1
       FROM sys.indexes
       WHERE name = N'UX_GoldenManifests_RunId'
         AND object_id = OBJECT_ID(N'dbo.GoldenManifests'))
    CREATE UNIQUE INDEX UX_GoldenManifests_RunId ON dbo.GoldenManifests (RunId);
GO
