/*
  Rollback 078: remove billing tables, RLS bindings, and procedures.
*/

IF EXISTS (SELECT 1 FROM sys.security_policies WHERE name = N'ArchiforgeTenantScope')
   AND OBJECT_ID(N'dbo.BillingSubscriptions', N'U') IS NOT NULL
BEGIN
    ALTER SECURITY POLICY rls.ArchiforgeTenantScope
        DROP FILTER PREDICATE ON dbo.BillingSubscriptions,
        DROP BLOCK PREDICATE ON dbo.BillingSubscriptions FOR AFTER INSERT,
        DROP BLOCK PREDICATE ON dbo.BillingSubscriptions FOR AFTER UPDATE,
        DROP BLOCK PREDICATE ON dbo.BillingSubscriptions FOR BEFORE DELETE;
END;
GO

IF OBJECT_ID(N'dbo.sp_Billing_Cancel', N'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_Billing_Cancel;
GO

IF OBJECT_ID(N'dbo.sp_Billing_Reinstate', N'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_Billing_Reinstate;
GO

IF OBJECT_ID(N'dbo.sp_Billing_Suspend', N'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_Billing_Suspend;
GO

IF OBJECT_ID(N'dbo.sp_Billing_Activate', N'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_Billing_Activate;
GO

IF OBJECT_ID(N'dbo.sp_Billing_UpsertPending', N'P') IS NOT NULL
    DROP PROCEDURE dbo.sp_Billing_UpsertPending;
GO

IF OBJECT_ID(N'dbo.BillingWebhookEvents', N'U') IS NOT NULL
    DROP TABLE dbo.BillingWebhookEvents;
GO

IF OBJECT_ID(N'dbo.BillingSubscriptions', N'U') IS NOT NULL
    DROP TABLE dbo.BillingSubscriptions;
GO
