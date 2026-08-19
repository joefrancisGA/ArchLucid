/*
  164: TrialSeatsUsed DEFAULT must be 0 for new tenants (072 used DEFAULT 1 by mistake).

  Idle tenants therefore showed TrialSeatsUsed = 1 even when TryClaimTrialSeatAsync correctly no-op’d.
*/

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL AND COL_LENGTH(N'dbo.Tenants', N'TrialSeatsUsed') IS NOT NULL
BEGIN
    DECLARE @DropDefault nvarchar(max);

    SELECT @DropDefault =
        N'ALTER TABLE dbo.Tenants DROP CONSTRAINT ' + QUOTENAME(dc.name) + N';'
    FROM sys.default_constraints AS dc
             INNER JOIN sys.columns AS c
                        ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
    WHERE dc.parent_object_id = OBJECT_ID(N'dbo.Tenants', N'U')
      AND c.name = N'TrialSeatsUsed';

    IF @DropDefault IS NOT NULL
        EXEC sys.sp_executesql @DropDefault;

    IF NOT EXISTS (SELECT 1
                   FROM sys.default_constraints AS dc
                            INNER JOIN sys.columns AS c
                                       ON c.object_id = dc.parent_object_id AND c.column_id = dc.parent_column_id
                   WHERE dc.parent_object_id = OBJECT_ID(N'dbo.Tenants', N'U')
                     AND c.name = N'TrialSeatsUsed')
        ALTER TABLE dbo.Tenants
            ADD CONSTRAINT DF_Tenants_TrialSeatsUsed DEFAULT ((0)) FOR TrialSeatsUsed;
END;
GO
