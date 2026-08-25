/* 331 — Pre-serialized GET snapshot for architecture intake drafts (fast open path). */

IF OBJECT_ID(N'dbo.DraftRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.DraftRequests', N'ReadModelJson') IS NULL
BEGIN
    ALTER TABLE dbo.DraftRequests
        ADD ReadModelJson NVARCHAR(MAX) NULL,
            ReadModelSchemaVersion INT NOT NULL
                CONSTRAINT DF_DraftRequests_ReadModelSchemaVersion DEFAULT (0);

    ALTER TABLE dbo.DraftRequests
        ADD CONSTRAINT CK_DraftRequests_ReadModelJson
            CHECK (ReadModelJson IS NULL OR ISJSON(ReadModelJson) = 1);
END;
GO
