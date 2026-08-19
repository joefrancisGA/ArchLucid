-- TB-037: provenance snapshot revision hash for freshness checks on read.
IF COL_LENGTH('dbo.ProvenanceSnapshots', 'SourceRevisionHash') IS NULL
BEGIN
    ALTER TABLE dbo.ProvenanceSnapshots ADD SourceRevisionHash NVARCHAR(64) NULL;
END;
