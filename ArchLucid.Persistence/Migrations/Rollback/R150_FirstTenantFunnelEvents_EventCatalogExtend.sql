/*
  Rollback 150: Restore dbo.FirstTenantFunnelEvents EventName CHECK to the pre-150 shape
  described in 150_FirstTenantFunnelEvents_EventCatalogExtend.sql.

  - DbUp-from-112: CK_FirstTenantFunnelEvents_EventName (six values only).
  - Consolidated ArchLucid.sql / ArchLucid_Unified_Schema.sql: PK_FirstTenantFunnelEvents2
    plus CK_FirstTenantFunnelEvents_EventName2 (eight values).

  Rolling back the DbUp path can fail if rows exist for first_finalization_attempted or
  first_export_opened; delete or retarget those rows before running this rollback.
*/
IF OBJECT_ID(N'dbo.FirstTenantFunnelEvents', N'U') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sys.check_constraints AS cc
            INNER JOIN sys.tables AS t ON cc.parent_object_id = t.object_id
        WHERE SCHEMA_NAME(t.schema_id) = N'dbo'
          AND t.name = N'FirstTenantFunnelEvents'
          AND cc.name = N'CK_FirstTenantFunnelEvents_EventName'
    )
        ALTER TABLE dbo.FirstTenantFunnelEvents DROP CONSTRAINT CK_FirstTenantFunnelEvents_EventName;

    IF EXISTS (
        SELECT 1
        FROM sys.key_constraints AS kc
        WHERE kc.parent_object_id = OBJECT_ID(N'dbo.FirstTenantFunnelEvents', N'U')
          AND kc.type = N'PK'
          AND kc.name = N'PK_FirstTenantFunnelEvents2'
    )
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM sys.check_constraints AS cc
                INNER JOIN sys.tables AS t ON cc.parent_object_id = t.object_id
            WHERE SCHEMA_NAME(t.schema_id) = N'dbo'
              AND t.name = N'FirstTenantFunnelEvents'
              AND cc.name = N'CK_FirstTenantFunnelEvents_EventName2'
        )
            ALTER TABLE dbo.FirstTenantFunnelEvents ADD CONSTRAINT CK_FirstTenantFunnelEvents_EventName2
                CHECK (EventName IN (
                    N'signup',
                    N'tour_opt_in',
                    N'first_run_started',
                    N'first_run_committed',
                    N'first_finding_viewed',
                    N'first_finalization_attempted',
                    N'first_export_opened',
                    N'thirty_minute_milestone'
                ));
    END
    ELSE
    BEGIN
        IF NOT EXISTS (
            SELECT 1
            FROM sys.check_constraints AS cc
                INNER JOIN sys.tables AS t ON cc.parent_object_id = t.object_id
            WHERE SCHEMA_NAME(t.schema_id) = N'dbo'
              AND t.name = N'FirstTenantFunnelEvents'
              AND cc.name = N'CK_FirstTenantFunnelEvents_EventName'
        )
            ALTER TABLE dbo.FirstTenantFunnelEvents ADD CONSTRAINT CK_FirstTenantFunnelEvents_EventName
                CHECK (EventName IN (
                    N'signup',
                    N'tour_opt_in',
                    N'first_run_started',
                    N'first_run_committed',
                    N'first_finding_viewed',
                    N'thirty_minute_milestone'
                ));
    END
END;
GO
