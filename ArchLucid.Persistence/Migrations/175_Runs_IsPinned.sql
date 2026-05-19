/*
  Workspace curation: operators can pin gold-standard reference runs in the run list.
*/

IF COL_LENGTH(N'dbo.Runs', N'IsPinned') IS NULL
    ALTER TABLE dbo.Runs ADD IsPinned BIT NOT NULL CONSTRAINT DF_Runs_IsPinned DEFAULT (0);
GO
