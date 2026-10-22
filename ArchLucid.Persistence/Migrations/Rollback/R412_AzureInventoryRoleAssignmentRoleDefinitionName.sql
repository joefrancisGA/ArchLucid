/*
  Rollback 412: drop the Azure role display name on inventory role assignments.
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.AzureInventoryRoleAssignments', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.AzureInventoryRoleAssignments', N'RoleDefinitionName') IS NOT NULL
BEGIN
    ALTER TABLE dbo.AzureInventoryRoleAssignments
        DROP COLUMN RoleDefinitionName;
END;
GO
