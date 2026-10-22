/*
  Roll back DbUp 181 — remove AlertRecords.IsArchived.
*/

IF COL_LENGTH(N'dbo.AlertRecords', N'IsArchived') IS NOT NULL
BEGIN
    ALTER TABLE dbo.AlertRecords DROP CONSTRAINT IF EXISTS DF_AlertRecords_IsArchived;
    ALTER TABLE dbo.AlertRecords DROP COLUMN IsArchived;
END;
GO
