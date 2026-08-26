/* Rollback for migration 331: remove pre-serialized draft GET snapshot columns. */

IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
   AND EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'CK_DraftRequests_ReadModelJson')
BEGIN
    ALTER TABLE dbo.DraftRequests DROP CONSTRAINT CK_DraftRequests_ReadModelJson;
END;
GO

IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DraftRequests', N'ReadModelJson') IS NOT NULL
BEGIN
    ALTER TABLE dbo.DraftRequests DROP COLUMN ReadModelJson;
END;
GO

IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DraftRequests', N'ReadModelSchemaVersion') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM sys.default_constraints WHERE name = N'DF_DraftRequests_ReadModelSchemaVersion')
    BEGIN
        ALTER TABLE dbo.DraftRequests DROP CONSTRAINT DF_DraftRequests_ReadModelSchemaVersion;
    END;

    ALTER TABLE dbo.DraftRequests DROP COLUMN ReadModelSchemaVersion;
END;
GO
