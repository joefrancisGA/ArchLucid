/* 354 — Persist hasher-bound golden-manifest fields that are not in the original 12 JSON slices.

   Hasher A (ManifestHashService v12) includes Policy, committed artifact inventory, create-time pins,
   feasibility, effective governance, review standards, and the decision-receipt hash. Those were
   hashed at save but dropped on hydrate, so GET /v1/authority/reviews/{runId} 409'd with
   "sealed manifest hash does not match recomputed hash" (demo Contoso + trial-welcome seeds).

   Resolves the physical table because migration 295 left dbo.GoldenManifests as a synonym. */

DECLARE @manifestTable sysname =
    CASE
        WHEN OBJECT_ID(N'dbo.SignedReviewRecords', N'U') IS NOT NULL THEN N'dbo.SignedReviewRecords'
        WHEN OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL THEN N'dbo.GoldenManifests'
    END;

IF @manifestTable IS NOT NULL
   AND COL_LENGTH(@manifestTable, N'HasherBoundJson') IS NULL
BEGIN
    DECLARE @addHasherBoundSql NVARCHAR(MAX) =
        N'ALTER TABLE ' + @manifestTable + N' ADD HasherBoundJson NVARCHAR(MAX) NULL;';

    EXEC sp_executesql @addHasherBoundSql;
END
GO
