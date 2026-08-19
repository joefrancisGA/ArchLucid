/*
  097: Per-tenant first-session completion marker (Core Pilot wizard funnel metric).

  One row per tenant; FirstSessionCompletedUtc set on first successful golden-manifest commit.
  RLS: tenant-only predicate (rls.archiforge_tenant_predicate from 096).
*/

IF OBJECT_ID(N'dbo.TenantOnboardingState', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.TenantOnboardingState
    (
        TenantId                 UNIQUEIDENTIFIER NOT NULL,
        FirstSessionCompletedUtc DATETIME2(7)     NULL,
        CONSTRAINT PK_TenantOnboardingState PRIMARY KEY CLUSTERED (TenantId),
        CONSTRAINT FK_TenantOnboardingState_Tenants FOREIGN KEY (TenantId) REFERENCES dbo.Tenants (Id)
    );
END;
GO

