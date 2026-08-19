/*
  Rollback 078: remove billing tables, RLS bindings, and procedures.
*/


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
