/*
  Rollback TB-2164 — drop findings child insert TVP types.
*/

IF TYPE_ID(N'dbo.FindingChildPropertyList') IS NOT NULL
    DROP TYPE dbo.FindingChildPropertyList;
GO

IF TYPE_ID(N'dbo.FindingChildSortNodeIdList') IS NOT NULL
    DROP TYPE dbo.FindingChildSortNodeIdList;
GO

IF TYPE_ID(N'dbo.FindingChildSortTextList') IS NOT NULL
    DROP TYPE dbo.FindingChildSortTextList;
GO
