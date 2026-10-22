/*
  409: Preserve PIM eligibility identity on persisted RBAC assignment evidence.
*/

SET NOCOUNT ON;
GO

IF COL_LENGTH(N'dbo.AzureInventoryRoleAssignments', N'PimEligibilityKind') IS NULL
BEGIN
    ALTER TABLE dbo.AzureInventoryRoleAssignments
        ADD PimEligibilityKind NVARCHAR(64) NULL;
END;
GO
