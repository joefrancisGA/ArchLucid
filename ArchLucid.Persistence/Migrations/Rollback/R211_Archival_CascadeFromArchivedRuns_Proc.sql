IF OBJECT_ID(N'dbo.Archival_CascadeFromArchivedRuns', N'P') IS NOT NULL
    DROP PROCEDURE dbo.Archival_CascadeFromArchivedRuns;
GO

IF TYPE_ID(N'dbo.ArchivedRunIdList') IS NOT NULL
    DROP TYPE dbo.ArchivedRunIdList;
GO
