/*
  R430 manual rollback: narrowing LeverageScore requires DBA review on populated rows — retain unless forced.
*/
SET NOCOUNT ON;
GO
PRINT N'R430 rollback: retain DECIMAL(22,3) LeverageScore unless operator scripts explicit down-migration.';
GO
