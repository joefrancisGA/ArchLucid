/*
  174: Rowstore PAGE compression on dbo.GoldenManifests and phase-1 relational child tables.

  Large NVARCHAR(MAX) JSON slices (manifest sections, RawDecisionJson, etc.) benefit from PAGE compression
  without changing column types — OPENJSON and ISJSON constraints remain valid on uncompressed in-row values.

  Companion: 088 on dbo.DecisioningTraces; large manifest bodies may also offload via ManifestPayloadBlobUri
  (ArtifactLargePayload). Idempotent: rebuilds only when any enabled rowstore partition is not already PAGE.

  SKU: PAGE compression unavailable on legacy DTU Basic; use vCore / DTU Standard+.
*/

IF OBJECT_ID(N'dbo.GoldenManifests', N'U') IS NOT NULL
   AND EXISTS (
        SELECT 1
        FROM sys.indexes AS i
        INNER JOIN sys.partitions AS p
            ON p.object_id = i.object_id AND p.index_id = i.index_id
        WHERE i.object_id = OBJECT_ID(N'dbo.GoldenManifests')
          AND i.is_disabled = 0
          AND i.type IN (0, 1, 2)
          AND p.data_compression_desc <> N'PAGE')
BEGIN
    ALTER INDEX ALL ON dbo.GoldenManifests REBUILD WITH (DATA_COMPRESSION = PAGE, SORT_IN_TEMPDB = ON);
END;
GO

IF OBJECT_ID(N'dbo.GoldenManifestDecisions', N'U') IS NOT NULL
   AND EXISTS (
        SELECT 1
        FROM sys.indexes AS i
        INNER JOIN sys.partitions AS p
            ON p.object_id = i.object_id AND p.index_id = i.index_id
        WHERE i.object_id = OBJECT_ID(N'dbo.GoldenManifestDecisions')
          AND i.is_disabled = 0
          AND i.type IN (0, 1, 2)
          AND p.data_compression_desc <> N'PAGE')
BEGIN
    ALTER INDEX ALL ON dbo.GoldenManifestDecisions REBUILD WITH (DATA_COMPRESSION = PAGE, SORT_IN_TEMPDB = ON);
END;
GO
