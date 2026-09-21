/*
  400: Extend dbo.FirstTenantFunnelEvents.EventName CHECK for live-seat funnel events
  (ADR 0102 / LS-017) — matches ArchLucid.Contracts.Telemetry.FirstTenantFunnelEventNames.All.
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
        FROM sys.check_constraints AS cc
            INNER JOIN sys.tables AS t ON cc.parent_object_id = t.object_id
        WHERE SCHEMA_NAME(t.schema_id) = N'dbo'
          AND t.name = N'FirstTenantFunnelEvents'
          AND cc.name = N'CK_FirstTenantFunnelEvents_EventName2'
    )
        ALTER TABLE dbo.FirstTenantFunnelEvents DROP CONSTRAINT CK_FirstTenantFunnelEvents_EventName2;

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
                N'first_finalization_attempted',
                N'first_export_opened',
                N'thirty_minute_milestone',
                N'first_session_purpose_live',
                N'first_session_purpose_training',
                N'post_auth_landed_dedicated_scope',
                N'post_auth_landed_sample_scope'
            ));
END;
GO
