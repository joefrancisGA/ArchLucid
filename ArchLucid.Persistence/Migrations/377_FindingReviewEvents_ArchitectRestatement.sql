/* 377 — FindingReviewEvents.ArchitectRestatement (LP-15 append-only operator wording). */

IF OBJECT_ID(N'dbo.FindingReviewEvents', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.FindingReviewEvents', N'ArchitectRestatement') IS NULL
    ALTER TABLE dbo.FindingReviewEvents ADD ArchitectRestatement NVARCHAR(MAX) NULL;
