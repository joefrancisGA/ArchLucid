/* R377: Rollback 377_FindingReviewEvents_ArchitectRestatement.sql — drop ArchitectRestatement. */

IF OBJECT_ID(N'dbo.FindingReviewEvents', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingReviewEvents', N'ArchitectRestatement') IS NOT NULL
    ALTER TABLE dbo.FindingReviewEvents DROP COLUMN ArchitectRestatement;
