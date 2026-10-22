-- ============================================================
-- ArchLucid RC6 — System Catalog verification script
-- Database : ArchLucid  (on archlucid-dev.database.windows.net)
-- Purpose  : Read-only sanity checks for the SystemWithPerTenantCatalogs topology.
-- Safe     : SELECT only. No DDL, DML, or schema changes.
--
-- Run in SSMS, Azure Data Studio, or sqlcmd against the ArchLucid database.
-- Connection string (no secret): Server=archlucid-dev.database.windows.net;
--   Database=ArchLucid;Authentication=Active Directory Default
--
-- All checks emit a PASS / FAIL / WARN label so you can grep the output.
-- ============================================================

SET NOCOUNT ON;

PRINT '============================================================';
PRINT ' ArchLucid System Catalog Verification';
PRINT ' Database: ' + DB_NAME();
PRINT ' Server  : ' + @@SERVERNAME;
PRINT ' Time    : ' + CONVERT(VARCHAR, GETUTCDATE(), 120) + ' UTC';
PRINT '============================================================';
PRINT '';

-- ── Check 1: Confirm dbo.Tenants exists ─────────────────────────────────────

PRINT '-- Check 1: dbo.Tenants exists';
IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL
BEGIN
    DECLARE @TenantCount INT = (SELECT COUNT(1) FROM dbo.Tenants);
    PRINT 'PASS  dbo.Tenants exists. Row count: ' + CAST(@TenantCount AS VARCHAR);
END
ELSE
BEGIN
    PRINT 'FAIL  dbo.Tenants does NOT exist in database ' + DB_NAME() + '.';
    PRINT '      This table must exist in the system catalog. Run SQL bootstrap or DbUp migrations.';
END
PRINT '';

-- ── Check 2: Confirm dbo.TenantDatabaseBindings exists ──────────────────────

PRINT '-- Check 2: dbo.TenantDatabaseBindings exists';
IF OBJECT_ID(N'dbo.TenantDatabaseBindings', N'U') IS NOT NULL
BEGIN
    DECLARE @BindingCount INT = (SELECT COUNT(1) FROM dbo.TenantDatabaseBindings);
    PRINT 'PASS  dbo.TenantDatabaseBindings exists. Row count: ' + CAST(@BindingCount AS VARCHAR);
END
ELSE
BEGIN
    PRINT 'FAIL  dbo.TenantDatabaseBindings does NOT exist.';
    PRINT '      The API cannot resolve tenant databases. Run SQL bootstrap.';
END
PRINT '';

-- ── Check 3: Dev seed tenant 11111111-....-1111 exists ──────────────────────

PRINT '-- Check 3: Dev seed tenant 11111111-1111-1111-1111-111111111111 exists';
DECLARE @DevTenantId UNIQUEIDENTIFIER = '11111111-1111-1111-1111-111111111111';

IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL
BEGIN
    IF EXISTS (SELECT 1 FROM dbo.Tenants WHERE Id = @DevTenantId)
    BEGIN
        SELECT
            'PASS  Dev seed tenant found' AS [Result],
            Id,
            Name,
            ProvisioningState,
            CreatedUtc
        FROM dbo.Tenants
        WHERE Id = @DevTenantId;
    END
    ELSE
    BEGIN
        PRINT 'WARN  Dev seed tenant 11111111-1111-1111-1111-111111111111 does NOT exist.';
        PRINT '      Expected when using dev seed data. Skip if this is a production environment.';
    END
END
ELSE
BEGIN
    PRINT 'SKIP  dbo.Tenants does not exist — skipping tenant check.';
END
PRINT '';

-- ── Check 4: Dev seed tenant has an active binding to ArchLucidTenantDev ────

PRINT '-- Check 4: Dev seed tenant has an active binding to ArchLucidTenantDev';
IF OBJECT_ID(N'dbo.TenantDatabaseBindings', N'U') IS NOT NULL
    AND OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL
BEGIN
    IF EXISTS (
        SELECT 1
        FROM   dbo.TenantDatabaseBindings tdb
        JOIN   dbo.Tenants t ON t.Id = tdb.TenantId
        WHERE  t.Id = @DevTenantId
    )
    BEGIN
        SELECT
            'PASS  Active binding found' AS [Result],
            tdb.TenantId,
            tdb.DatabaseName,
            tdb.ServerName,
            tdb.IsActive,
            tdb.CreatedUtc
        FROM dbo.TenantDatabaseBindings tdb
        JOIN dbo.Tenants t ON t.Id = tdb.TenantId
        WHERE t.Id = @DevTenantId;

        -- Warn if bound database is not the expected dev tenant name.
        IF NOT EXISTS (
            SELECT 1
            FROM   dbo.TenantDatabaseBindings tdb
            JOIN   dbo.Tenants t ON t.Id = tdb.TenantId
            WHERE  t.Id = @DevTenantId
            AND    tdb.DatabaseName = 'ArchLucidTenantDev'
        )
        BEGIN
            PRINT 'WARN  Binding exists but DatabaseName is not ''ArchLucidTenantDev''. Check the value above.';
        END
    END
    ELSE
    BEGIN
        PRINT 'FAIL  No binding found for dev seed tenant.';
        PRINT '      The API cannot route requests for this tenant. Seed the binding or run the API';
        PRINT '      with provisioning enabled to auto-create it.';
    END
END
ELSE
BEGIN
    PRINT 'SKIP  Required tables missing — skipping binding check.';
END
PRINT '';

-- ── Check 5: Dev seed tenant ProvisioningState = 1 (Active/Provisioned) ─────

PRINT '-- Check 5: Dev seed tenant ProvisioningState = 1';
IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL
BEGIN
    DECLARE @ProvisioningState INT;
    SELECT @ProvisioningState = ProvisioningState
    FROM   dbo.Tenants
    WHERE  Id = @DevTenantId;

    IF @ProvisioningState IS NULL
    BEGIN
        PRINT 'SKIP  Dev seed tenant not found — cannot check ProvisioningState.';
    END
    ELSE IF @ProvisioningState = 1
    BEGIN
        PRINT 'PASS  ProvisioningState = 1 (Provisioned/Active).';
    END
    ELSE
    BEGIN
        PRINT 'FAIL  ProvisioningState = ' + CAST(@ProvisioningState AS VARCHAR) + ' (expected 1).';
        PRINT '      Tenant may be in a Pending or Failed provisioning state.';
        PRINT '      Check tenant lifecycle or manually set ProvisioningState = 1 after diagnosing.';
    END
END
ELSE
BEGIN
    PRINT 'SKIP  dbo.Tenants not found.';
END
PRINT '';

-- ── Summary: list ALL tenants and bindings (informational) ──────────────────

PRINT '-- Informational: all tenants and bindings';
IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL
    AND OBJECT_ID(N'dbo.TenantDatabaseBindings', N'U') IS NOT NULL
BEGIN
    SELECT
        t.Id          AS TenantId,
        t.Name        AS TenantName,
        t.ProvisioningState,
        tdb.DatabaseName,
        tdb.ServerName,
        tdb.IsActive  AS BindingActive,
        t.CreatedUtc
    FROM dbo.Tenants t
    LEFT JOIN dbo.TenantDatabaseBindings tdb ON tdb.TenantId = t.Id
    ORDER BY t.CreatedUtc DESC;
END
ELSE
BEGIN
    PRINT 'SKIP  Tables missing.';
END

PRINT '';
PRINT '============================================================';
PRINT ' System Catalog verification complete.';
PRINT '============================================================';
