/*
  R421: Manual-only rollback for 421_SecurityEvidencePathSearchCoverage.sql.

  DESTRUCTIVE if bounded-search coverage records exist. These records explain
  which paths were not exhaustively evaluated; losing them can overstate
  security coverage. Prefer retaining the additive table for app-only rollback.

  Requires explicit owner/change-control approval, verified backup/PITR,
  and an application version that no longer reads or writes this table.
  Stop workers before any approved schema rollback.
  DbUp never executes this script automatically.
*/
SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.SecurityEvidencePathSearchCoverage', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.SecurityEvidencePathSearchCoverage)
    BEGIN
        THROW 50421,
            N'R421 blocked: bounded-search coverage evidence exists. Retain the table or export, reconcile, and explicitly empty it under approved change control.',
            1;
    END;

    DROP TABLE dbo.SecurityEvidencePathSearchCoverage;
END;
GO
