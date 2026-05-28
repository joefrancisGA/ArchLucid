/*
  R226: Rollback 226_ProvenanceSnapshots_SourceRevisionHash.sql — drop provenance snapshot revision hash column.
*/

IF OBJECT_ID(N'dbo.ProvenanceSnapshots', N'U') IS NULL
BEGIN
    RETURN;
END;
GO

IF COL_LENGTH(N'dbo.ProvenanceSnapshots', N'SourceRevisionHash') IS NOT NULL
    ALTER TABLE dbo.ProvenanceSnapshots DROP COLUMN SourceRevisionHash;
GO
