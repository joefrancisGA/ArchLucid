/* DbUp 158: DeletedUtc on dbo.Projects for retention-based hard purge after soft delete. */
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Projects', N'DeletedUtc') IS NULL
BEGIN
    ALTER TABLE dbo.Projects ADD DeletedUtc DATETIMEOFFSET NULL;
END;
GO

/* Backfill: approximate delete time as CreatedUtc when historical soft-deletes lack a timestamp. */
IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL
BEGIN
    UPDATE dbo.Projects
    SET DeletedUtc = CreatedUtc
    WHERE IsDeleted = 1
      AND DeletedUtc IS NULL;
END;
GO
