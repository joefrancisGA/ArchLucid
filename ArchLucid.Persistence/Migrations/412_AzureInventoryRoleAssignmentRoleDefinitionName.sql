/*
  412: Preserve the Azure role display name on inventory role assignments.
*/

SET NOCOUNT ON;
GO

IF COL_LENGTH(N'dbo.AzureInventoryRoleAssignments', N'RoleDefinitionName') IS NULL
BEGIN
    ALTER TABLE dbo.AzureInventoryRoleAssignments
        ADD RoleDefinitionName NVARCHAR(256) NULL;
END;
GO
