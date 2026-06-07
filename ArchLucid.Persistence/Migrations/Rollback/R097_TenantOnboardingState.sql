/*
  Rollback 097: remove RLS on TenantOnboardingState, then drop the table.
*/

IF OBJECT_ID(N'dbo.TenantOnboardingState', N'U') IS NOT NULL
    DROP TABLE dbo.TenantOnboardingState;
GO
