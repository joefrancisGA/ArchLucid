/*
  366: Customer-visible architecture display name (CA-02 / ADR 0074).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.Architectures', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Architectures', N'DisplayName') IS NULL
BEGIN
    ALTER TABLE dbo.Architectures
        ADD DisplayName NVARCHAR(200) NOT NULL
            CONSTRAINT DF_Architectures_DisplayName DEFAULT (N'Untitled architecture');
END;
GO

IF OBJECT_ID(N'dbo.Architectures', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Architectures', N'Description') IS NULL
BEGIN
    ALTER TABLE dbo.Architectures
        ADD Description NVARCHAR(500) NULL;
END;
GO
