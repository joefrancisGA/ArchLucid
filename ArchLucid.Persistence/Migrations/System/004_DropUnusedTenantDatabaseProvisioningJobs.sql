/*
  System-plane 004: Drop unused dbo.TenantDatabaseProvisioningJobs.

  Created in 002 as a provisioning queue. Live signup uses
  TenantDatabaseBindings.ProvisioningState plus WarmTenantCatalogStandby (TB-018).
  No application repository reads or writes this table.

  Idempotent: DROP only when present.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.TenantDatabaseProvisioningJobs', N'U') IS NOT NULL
    DROP TABLE dbo.TenantDatabaseProvisioningJobs;
GO
