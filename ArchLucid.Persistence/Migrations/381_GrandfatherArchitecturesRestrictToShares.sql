/*
  381: AS-088 — grandfather existing architectures as workspace-visible (RestrictToShares = 0).
  Idempotent brownfield backfill; no behavior change until opt-in (ADR 0087).
*/

SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.Architectures', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.Architectures', N'RestrictToShares') IS NOT NULL
BEGIN
    UPDATE dbo.Architectures
    SET RestrictToShares = 0;
END;
GO
