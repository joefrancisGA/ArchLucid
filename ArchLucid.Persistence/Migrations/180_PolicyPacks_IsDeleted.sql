/*
  Add IsDeleted column to dbo.PolicyPacks table to support soft-delete of policy packs.
*/

IF OBJECT_ID(N'dbo.PolicyPacks', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.PolicyPacks', N'IsDeleted') IS NULL
BEGIN
    ALTER TABLE dbo.PolicyPacks
        ADD IsDeleted BIT NOT NULL CONSTRAINT DF_PolicyPacks_IsDeleted DEFAULT (0);
END;
GO
