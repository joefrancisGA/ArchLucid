#!/usr/bin/env bash
# Add deterministic synthetic snapshots and ranked paths to the isolated k6 SQL catalog.
set -euo pipefail
db_name="${1:?usage: seed_securenow_scale_fixtures.sh <database_name>}"
sa_password="${SA_PASSWORD:-LocalTesting123!}"

docker run --rm --network host --entrypoint /opt/mssql-tools18/bin/sqlcmd \
  mcr.microsoft.com/mssql/server:2022-latest \
  -S "127.0.0.1,1433" -U sa -P "${sa_password}" -C -d "${db_name}" -b -Q "
SET NOCOUNT ON;
DECLARE @i INT = 1;
WHILE @i <= 2
BEGIN
    DECLARE @suffix NCHAR(12) = RIGHT(CONCAT(N'000000000000', CONVERT(NVARCHAR(12), @i, 16)), 12);
    DECLARE @tenant UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, CONCAT(N'10000000-0000-4000-8000-', @suffix));
    DECLARE @workspace UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, CONCAT(N'20000000-0000-4000-8000-', @suffix));
    DECLARE @project UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, CONCAT(N'30000000-0000-4000-8000-', @suffix));
    DECLARE @package UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, CONCAT(N'40000000-0000-4000-8000-', @suffix));
    DECLARE @snapshot UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, CONCAT(N'50000000-0000-4000-8000-', @suffix));
    IF NOT EXISTS (SELECT 1 FROM dbo.AzureExtractorPackages WHERE PackageId = @package)
        INSERT dbo.AzureExtractorPackages
            (PackageId, TenantId, WorkspaceId, ProjectId, CreatedUtc, SchemaVersion, OriginalFileName, ManifestJson, PackageBytes)
        VALUES (@package, @tenant, @workspace, @project, SYSUTCDATETIME(), 1,
                N'synthetic-scale.zip', N'{}', 0x00);
    IF NOT EXISTS (SELECT 1 FROM dbo.AzureInventorySnapshots WHERE SnapshotId = @snapshot)
        INSERT dbo.AzureInventorySnapshots
            (SnapshotId, TenantId, WorkspaceId, ProjectId, PackageId, CaptureStatus, CreatedUtc, UpdatedUtc)
        VALUES (@snapshot, @tenant, @workspace, @project, @package, 1, SYSUTCDATETIME(), SYSUTCDATETIME());

    DECLARE @j INT = 1;
    WHILE @j <= 100
    BEGIN
        DECLARE @pathSuffix NCHAR(12) = CONCAT(RIGHT(CONCAT(N'000', @i), 3), RIGHT(CONCAT(N'000000000', @j), 9));
        DECLARE @path UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, CONCAT(N'60000000-0000-4000-8000-', @pathSuffix));
        IF NOT EXISTS (SELECT 1 FROM dbo.SecurityEvidencePaths WHERE PathId = @path)
            INSERT dbo.SecurityEvidencePaths
                (PathId, TenantId, WorkspaceId, ProjectId, SnapshotId, PathKind, PathConfidenceBand,
                 CanonicalHopHashSha256, WeakestHopOrdinal, WeakestHopReason, CreatedUtc, UpdatedUtc)
            VALUES (@path, @tenant, @workspace, @project, @snapshot, 0, 0,
                    HASHBYTES('SHA2_256', CONCAT(@tenant, N':', @j)), 1, N'Synthetic seeded path', SYSUTCDATETIME(), SYSUTCDATETIME());
        IF NOT EXISTS (SELECT 1 FROM dbo.SecurityEvidencePathRanks WHERE TenantId = @tenant AND PathId = @path)
            INSERT dbo.SecurityEvidencePathRanks
                (PathId, TenantId, SnapshotId, RuleVersion, TechnicalExposureScore, PrivilegeDepthScore,
                 BlastRadiusScore, ConfidenceBandScore, CompositeSortScore, RankOrder,
                 ExplanationSummary, BreakdownJson, ComputedUtc)
            VALUES (@path, @tenant, @snapshot, N'synthetic-scale-v1', 0.50, 0.50, 0.50, 0.50,
                    0.500, @j, N'Synthetic ranked path', N'{}', SYSUTCDATETIME());
        SET @j += 1;
    END
    SET @i += 1;
END
SELECT COUNT(*) AS SeededRanks FROM dbo.SecurityEvidencePathRanks
WHERE RuleVersion = N'synthetic-scale-v1';
"
