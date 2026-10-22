/* Rollback for migration 337: drop tenant-persisted wizard intake drafts. */

IF OBJECT_ID(N'dbo.WizardIntakeDrafts', N'U') IS NOT NULL
BEGIN
    DROP TABLE dbo.WizardIntakeDrafts;
END;
GO
