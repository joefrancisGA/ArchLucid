/* Reverse 432 only after reverting the dependent application.
   Retain all persisted standalone-run scope and actor evidence.
   If rows exist, stop and use an approved evidence-preserving recovery plan. */
SET XACT_ABORT ON;
BEGIN TRANSACTION;
IF OBJECT_ID(N'dbo.ArchitectureIntelligenceStandaloneRuns', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.ArchitectureIntelligenceStandaloneRuns WITH (TABLOCKX, HOLDLOCK))
        THROW 51432, N'Standalone run evidence exists. Refusing destructive rollback.', 1;

    DROP TABLE dbo.ArchitectureIntelligenceStandaloneRuns;
END;
COMMIT TRANSACTION;
GO
