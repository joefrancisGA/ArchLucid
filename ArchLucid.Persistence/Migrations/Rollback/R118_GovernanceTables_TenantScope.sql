/*
  Rollback 118: remove RLS bindings, drop FKs, drop scope indexes, drop scope columns on governance tables.
*/

IF EXISTS (SELECT 1 FROM sys.security_policies WHERE name = N'ArchLucidTenantScope')
   AND OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
BEGIN
    ALTER SECURITY POLICY rls.ArchLucidTenantScope
        DROP FILTER PREDICATE ON dbo.GovernanceApprovalRequests,
        DROP BLOCK PREDICATE ON dbo.GovernanceApprovalRequests FOR AFTER INSERT,
        DROP BLOCK PREDICATE ON dbo.GovernanceApprovalRequests FOR AFTER UPDATE,
        DROP BLOCK PREDICATE ON dbo.GovernanceApprovalRequests FOR BEFORE DELETE;
END;
GO

IF EXISTS (SELECT 1 FROM sys.security_policies WHERE name = N'ArchLucidTenantScope')
   AND OBJECT_ID(N'dbo.GovernancePromotionRecords', N'U') IS NOT NULL
BEGIN
    ALTER SECURITY POLICY rls.ArchLucidTenantScope
        DROP FILTER PREDICATE ON dbo.GovernancePromotionRecords,
        DROP BLOCK PREDICATE ON dbo.GovernancePromotionRecords FOR AFTER INSERT,
        DROP BLOCK PREDICATE ON dbo.GovernancePromotionRecords FOR AFTER UPDATE,
        DROP BLOCK PREDICATE ON dbo.GovernancePromotionRecords FOR BEFORE DELETE;
END;
GO

IF EXISTS (SELECT 1 FROM sys.security_policies WHERE name = N'ArchLucidTenantScope')
   AND OBJECT_ID(N'dbo.GovernanceEnvironmentActivations', N'U') IS NOT NULL
BEGIN
    ALTER SECURITY POLICY rls.ArchLucidTenantScope
        DROP FILTER PREDICATE ON dbo.GovernanceEnvironmentActivations,
        DROP BLOCK PREDICATE ON dbo.GovernanceEnvironmentActivations FOR AFTER INSERT,
        DROP BLOCK PREDICATE ON dbo.GovernanceEnvironmentActivations FOR AFTER UPDATE,
        DROP BLOCK PREDICATE ON dbo.GovernanceEnvironmentActivations FOR BEFORE DELETE;
END;
GO

IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND EXISTS (
        SELECT 1
        FROM sys.foreign_keys AS fk
        WHERE fk.parent_object_id = OBJECT_ID(N'dbo.GovernanceApprovalRequests')
          AND fk.name = N'FK_GovernanceApprovalRequests_Tenants')
    ALTER TABLE dbo.GovernanceApprovalRequests DROP CONSTRAINT FK_GovernanceApprovalRequests_Tenants;
GO

IF OBJECT_ID(N'dbo.GovernancePromotionRecords', N'U') IS NOT NULL
   AND EXISTS (
        SELECT 1
        FROM sys.foreign_keys AS fk
        WHERE fk.parent_object_id = OBJECT_ID(N'dbo.GovernancePromotionRecords')
          AND fk.name = N'FK_GovernancePromotionRecords_Tenants')
    ALTER TABLE dbo.GovernancePromotionRecords DROP CONSTRAINT FK_GovernancePromotionRecords_Tenants;
GO

IF OBJECT_ID(N'dbo.GovernanceEnvironmentActivations', N'U') IS NOT NULL
   AND EXISTS (
        SELECT 1
        FROM sys.foreign_keys AS fk
        WHERE fk.parent_object_id = OBJECT_ID(N'dbo.GovernanceEnvironmentActivations')
          AND fk.name = N'FK_GovernanceEnvironmentActivations_Tenants')
    ALTER TABLE dbo.GovernanceEnvironmentActivations DROP CONSTRAINT FK_GovernanceEnvironmentActivations_Tenants;
GO

IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = N'IX_GovernanceApprovalRequests_Scope_RequestedUtc'
          AND object_id = OBJECT_ID(N'dbo.GovernanceApprovalRequests'))
    DROP INDEX IX_GovernanceApprovalRequests_Scope_RequestedUtc ON dbo.GovernanceApprovalRequests;
GO

IF OBJECT_ID(N'dbo.GovernancePromotionRecords', N'U') IS NOT NULL
   AND EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = N'IX_GovernancePromotionRecords_Scope_PromotedUtc'
          AND object_id = OBJECT_ID(N'dbo.GovernancePromotionRecords'))
    DROP INDEX IX_GovernancePromotionRecords_Scope_PromotedUtc ON dbo.GovernancePromotionRecords;
GO

IF OBJECT_ID(N'dbo.GovernanceEnvironmentActivations', N'U') IS NOT NULL
   AND EXISTS (
        SELECT 1 FROM sys.indexes
        WHERE name = N'IX_GovernanceEnvironmentActivations_Scope_ActivatedUtc'
          AND object_id = OBJECT_ID(N'dbo.GovernanceEnvironmentActivations'))
    DROP INDEX IX_GovernanceEnvironmentActivations_Scope_ActivatedUtc ON dbo.GovernanceEnvironmentActivations;
GO

IF OBJECT_ID(N'dbo.GovernanceApprovalRequests', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceApprovalRequests', N'TenantId') IS NOT NULL
BEGIN
    ALTER TABLE dbo.GovernanceApprovalRequests DROP COLUMN TenantId;
    ALTER TABLE dbo.GovernanceApprovalRequests DROP COLUMN WorkspaceId;
    ALTER TABLE dbo.GovernanceApprovalRequests DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.GovernancePromotionRecords', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernancePromotionRecords', N'TenantId') IS NOT NULL
BEGIN
    ALTER TABLE dbo.GovernancePromotionRecords DROP COLUMN TenantId;
    ALTER TABLE dbo.GovernancePromotionRecords DROP COLUMN WorkspaceId;
    ALTER TABLE dbo.GovernancePromotionRecords DROP COLUMN ProjectId;
END;
GO

IF OBJECT_ID(N'dbo.GovernanceEnvironmentActivations', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.GovernanceEnvironmentActivations', N'TenantId') IS NOT NULL
BEGIN
    ALTER TABLE dbo.GovernanceEnvironmentActivations DROP COLUMN TenantId;
    ALTER TABLE dbo.GovernanceEnvironmentActivations DROP COLUMN WorkspaceId;
    ALTER TABLE dbo.GovernanceEnvironmentActivations DROP COLUMN ProjectId;
END;
GO
