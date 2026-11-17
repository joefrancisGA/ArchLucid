/*
  423: Preserve full tag provenance on a routing row.
  1,285 UTF-16 code units allow 1,024 for the resource ID, 256 for the tag key, and 5 for tag: and @.
  Widen the existing unindexed column without changing its nullability.
*/

IF COL_LENGTH(N'dbo.SecurityEvidencePathRouting', N'SourceReference') = 1024
BEGIN
    ALTER TABLE dbo.SecurityEvidencePathRouting
        ALTER COLUMN SourceReference NVARCHAR(1285) NOT NULL;
END;
GO
