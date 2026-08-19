/*
  TB-2164 — Table-valued parameters for findings child inserts (stable plan cache shape).
*/

IF TYPE_ID(N'dbo.FindingChildSortTextList') IS NULL
    CREATE TYPE dbo.FindingChildSortTextList AS TABLE
    (
        SortOrder INT NOT NULL,
        TextValue NVARCHAR(MAX) NOT NULL
    );
GO

IF TYPE_ID(N'dbo.FindingChildSortNodeIdList') IS NULL
    CREATE TYPE dbo.FindingChildSortNodeIdList AS TABLE
    (
        SortOrder INT NOT NULL,
        NodeId NVARCHAR(500) NOT NULL
    );
GO

IF TYPE_ID(N'dbo.FindingChildPropertyList') IS NULL
    CREATE TYPE dbo.FindingChildPropertyList AS TABLE
    (
        PropertySortOrder INT NOT NULL,
        PropertyKey NVARCHAR(200) NOT NULL,
        PropertyValue NVARCHAR(MAX) NOT NULL
    );
GO
