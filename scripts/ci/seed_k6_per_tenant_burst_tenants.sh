#!/usr/bin/env bash
# Seed dbo.Tenants / TenantWorkspaces / Projects for tests/load/per-tenant-burst.js scope GUIDs.
# Usage: seed_k6_per_tenant_burst_tenants.sh <database_name>
# Env: SA_PASSWORD (default: LocalTesting123!)
set -euo pipefail

DB_NAME="${1:?usage: seed_k6_per_tenant_burst_tenants.sh <database_name>}"
SA_PASSWORD="${SA_PASSWORD:-LocalTesting123!}"

echo "Seeding k6 per-tenant burst tenants in ${DB_NAME}..."

docker run --rm --network host --entrypoint /opt/mssql-tools18/bin/sqlcmd \
  mcr.microsoft.com/mssql/server:2022-latest \
  -S "127.0.0.1,1433" -U sa -P "${SA_PASSWORD}" -C -d "${DB_NAME}" -b -Q "
SET NOCOUNT ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;

DECLARE @i INT = 1;
WHILE @i <= 10
BEGIN
    DECLARE @suffix NCHAR(12) = RIGHT(CONCAT(N'000000000000', CONVERT(NVARCHAR(12), @i, 16)), 12);
    DECLARE @tenantId UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, CONCAT(N'10000000-0000-4000-8000-', @suffix));
    DECLARE @workspaceId UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, CONCAT(N'20000000-0000-4000-8000-', @suffix));
    DECLARE @projectId UNIQUEIDENTIFIER = CONVERT(UNIQUEIDENTIFIER, CONCAT(N'30000000-0000-4000-8000-', @suffix));
    DECLARE @slug NVARCHAR(100) = CONCAT(N'k6-burst-t', @i);
    DECLARE @name NVARCHAR(200) = CONCAT(N'K6 burst tenant ', @i);

    IF NOT EXISTS (SELECT 1 FROM dbo.Tenants WHERE Id = @tenantId)
    BEGIN
        INSERT INTO dbo.Tenants (Id, Name, Slug, Tier)
        VALUES (@tenantId, @name, @slug, N'Standard');
    END

    IF NOT EXISTS (SELECT 1 FROM dbo.TenantWorkspaces WHERE Id = @workspaceId)
    BEGIN
        INSERT INTO dbo.TenantWorkspaces (Id, TenantId, Name, DefaultProjectId)
        VALUES (@workspaceId, @tenantId, N'default', @projectId);
    END

    IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL
       AND NOT EXISTS (SELECT 1 FROM dbo.Projects WHERE Id = @projectId)
    BEGIN
        INSERT INTO dbo.Projects (Id, TenantId, WorkspaceId, Name, IsDeleted)
        VALUES (@projectId, @tenantId, @workspaceId, N'default', 0);
    END

    SET @i += 1;
END
"

echo "k6 per-tenant burst tenant seed complete."
