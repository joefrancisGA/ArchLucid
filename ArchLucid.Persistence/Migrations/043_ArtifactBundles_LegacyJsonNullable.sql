-- Legacy dual-write JSON columns on ArtifactBundles may be unset when relational slices
-- are authoritative or a header row is inserted before JSON backfill (see SqlArtifactBundleRepository).
IF OBJECT_ID(N'dbo.ArtifactBundles', N'U') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.tables t ON c.object_id = t.object_id
        WHERE t.schema_id = SCHEMA_ID(N'dbo')
          AND t.name = N'ArtifactBundles'
          AND c.name = N'ArtifactsJson'
          AND c.is_nullable = 0)
        ALTER TABLE dbo.ArtifactBundles ALTER COLUMN ArtifactsJson NVARCHAR(MAX) NULL;

    IF EXISTS (
        SELECT 1
        FROM sys.columns c
        INNER JOIN sys.tables t ON c.object_id = t.object_id
        WHERE t.schema_id = SCHEMA_ID(N'dbo')
          AND t.name = N'ArtifactBundles'
          AND c.name = N'TraceJson'
          AND c.is_nullable = 0)
        ALTER TABLE dbo.ArtifactBundles ALTER COLUMN TraceJson NVARCHAR(MAX) NULL;
END;
