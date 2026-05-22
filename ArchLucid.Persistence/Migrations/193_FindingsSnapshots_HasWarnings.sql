/*
  193: Add dbo.FindingsSnapshots.HasWarnings for hot-path run list queries (HotPathRelationalQueryShapes / SqlRunRepository).
*/

IF OBJECT_ID(N'dbo.FindingsSnapshots', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingsSnapshots', N'HasWarnings') IS NULL
    ALTER TABLE dbo.FindingsSnapshots ADD HasWarnings BIT NOT NULL
        CONSTRAINT DF_FindingsSnapshots_HasWarnings DEFAULT (0);
GO
