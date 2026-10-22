/*
  Rollback 409: drop PIM eligibility identity on persisted RBAC assignment evidence.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AzureInventoryRoleAssignments', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AzureInventoryRoleAssignments', N'PimEligibilityKind') IS NOT NULL
BEGIN
    ALTER TABLE dbo.AzureInventoryRoleAssignments
        DROP COLUMN PimEligibilityKind;
END;
GO
