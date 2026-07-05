-- ============================================================
-- ArchLucid RC6 — Tenant Catalog verification script
-- Database : ArchLucidTenantDev  (on archlucid-dev.database.windows.net)
-- Purpose  : Read-only schema sanity checks for a per-tenant catalog database.
-- Safe     : SELECT / sys.* queries only. No DDL, DML, or schema changes.
--
-- Run in SSMS, Azure Data Studio, or sqlcmd against the ArchLucidTenantDev database.
-- Connection string (no secret): Server=archlucid-dev.database.windows.net;
--   Database=ArchLucidTenantDev;Authentication=Active Directory Default
--
-- All checks emit PASS / FAIL / WARN so you can grep the output.
-- ============================================================

SET NOCOUNT ON;

PRINT '============================================================';
PRINT ' ArchLucid Tenant Catalog Verification';
PRINT ' Database: ' + DB_NAME();
PRINT ' Server  : ' + @@SERVERNAME;
PRINT ' Time    : ' + CONVERT(VARCHAR, GETUTCDATE(), 120) + ' UTC';
PRINT '============================================================';
PRINT '';

-- ── Check 1: dbo.Tenants must NOT be required in a tenant catalog ────────────
-- In SystemWithPerTenantCatalogs topology, dbo.Tenants belongs to the system
-- catalog only. Its presence here is not a failure (the bootstrap script creates
-- it, but guards all FKs with OBJECT_ID checks) but FKs referencing it from
-- tenant-scoped tables must not exist when dbo.Tenants is absent.

PRINT '-- Check 1: dbo.Tenants presence (informational — not required in tenant catalog)';
IF OBJECT_ID(N'dbo.Tenants', N'U') IS NOT NULL
BEGIN
    DECLARE @TenantCount INT = (SELECT COUNT(1) FROM dbo.Tenants);
    PRINT 'INFO  dbo.Tenants EXISTS in this tenant catalog with ' + CAST(@TenantCount AS VARCHAR) + ' row(s).';
    PRINT '      This is acceptable when the unified bootstrap script was run here.';
    PRINT '      Confirm no unexpected data: it should be empty or contain only this tenant''s record.';
END
ELSE
BEGIN
    PRINT 'INFO  dbo.Tenants does NOT exist — correct for a pure tenant catalog.';
END
PRINT '';

-- ── Check 2: No FK references dbo.Tenants when dbo.Tenants is absent ─────────

PRINT '-- Check 2: Foreign keys referencing dbo.Tenants';
IF OBJECT_ID(N'dbo.Tenants', N'U') IS NULL
BEGIN
    -- dbo.Tenants absent — any FK referencing it would have caused a bootstrap failure.
    -- If we get here dbo.Tenants was absent AND bootstrap succeeded, so no such FKs should exist.
    DECLARE @BadFkCount INT = (
        SELECT COUNT(1)
        FROM   sys.foreign_keys fk
        JOIN   sys.tables       ref ON ref.object_id = fk.referenced_object_id
        JOIN   sys.schemas      s   ON s.schema_id   = ref.schema_id
        WHERE  ref.name  = 'Tenants'
        AND    s.name    = 'dbo'
    );

    IF @BadFkCount = 0
    BEGIN
        PRINT 'PASS  No foreign keys reference dbo.Tenants (correct — dbo.Tenants is absent).';
    END
    ELSE
    BEGIN
        PRINT 'FAIL  ' + CAST(@BadFkCount AS VARCHAR) + ' foreign key(s) reference dbo.Tenants but dbo.Tenants does not exist.';
        PRINT '      This would cause a bootstrap failure on the next deploy. Listed below:';
        SELECT
            fk.name                            AS ForeignKeyName,
            OBJECT_NAME(fk.parent_object_id)   AS [Table],
            COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS [Column]
        FROM sys.foreign_keys       fk
        JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
        JOIN sys.tables             ref ON ref.object_id = fk.referenced_object_id
        JOIN sys.schemas            s   ON s.schema_id   = ref.schema_id
        WHERE ref.name = 'Tenants'
        AND   s.name   = 'dbo';
    END
END
ELSE
BEGIN
    PRINT 'INFO  dbo.Tenants is present — FK references are valid. Listing for reference:';
    SELECT
        fk.name                            AS ForeignKeyName,
        OBJECT_NAME(fk.parent_object_id)   AS [Table],
        COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS [Column]
    FROM sys.foreign_keys       fk
    JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
    JOIN sys.tables             ref ON ref.object_id = fk.referenced_object_id
    JOIN sys.schemas            s   ON s.schema_id   = ref.schema_id
    WHERE ref.name = 'Tenants'
    AND   s.name   = 'dbo';
END
PRINT '';

-- ── Check 3: Governance workflow tables exist ────────────────────────────────

PRINT '-- Check 3: Governance workflow tables';
DECLARE @GovTables TABLE (TableName NVARCHAR(128));
INSERT INTO @GovTables VALUES
    ('GovernanceApprovalRequests'),
    ('GovernancePromotionRecords'),
    ('GovernanceEnvironmentActivations');

DECLARE @GovName NVARCHAR(128);
DECLARE govCur CURSOR LOCAL FAST_FORWARD FOR
    SELECT TableName FROM @GovTables;

OPEN govCur;
FETCH NEXT FROM govCur INTO @GovName;
WHILE @@FETCH_STATUS = 0
BEGIN
    IF OBJECT_ID(N'dbo.' + @GovName, N'U') IS NOT NULL
    BEGIN
        DECLARE @GovCount INT;
        EXEC('SELECT @c = COUNT(1) FROM dbo.' + @GovName);
        PRINT 'PASS  dbo.' + @GovName + ' exists.';
    END
    ELSE
    BEGIN
        PRINT 'FAIL  dbo.' + @GovName + ' does NOT exist.';
        PRINT '      SQL bootstrap is missing this table definition. Re-run ArchLucid.sql or run DbUp migrations 038+.';
    END
    FETCH NEXT FROM govCur INTO @GovName;
END
CLOSE govCur;
DEALLOCATE govCur;
PRINT '';

-- ── Check 4: CommitRunIdempotency exists ────────────────────────────────────

PRINT '-- Check 4: dbo.CommitRunIdempotency';
IF OBJECT_ID(N'dbo.CommitRunIdempotency', N'U') IS NOT NULL
BEGIN
    PRINT 'PASS  dbo.CommitRunIdempotency exists.';
END
ELSE
BEGIN
    PRINT 'WARN  dbo.CommitRunIdempotency does NOT exist.';
    PRINT '      Expected if DbUp migration 159 has been applied. Skip if this is a fresh catalog';
    PRINT '      that has not yet run a commit.';
END
PRINT '';

-- ── Check 5: Key indexes exist ───────────────────────────────────────────────

PRINT '-- Check 5: Key indexes';
DECLARE @KeyIndexes TABLE (TableName NVARCHAR(128), IndexName NVARCHAR(256));
INSERT INTO @KeyIndexes VALUES
    ('GovernanceApprovalRequests', 'IX_GovernanceApprovalRequests_PendingSlaBreached'),
    ('GovernanceApprovalRequests', 'IX_GovernanceApprovalRequests_Status_RequestedUtc'),
    ('GovernanceEnvironmentActivations', 'IX_GovernanceEnvironmentActivations_TenantId'),
    ('GovernancePromotionRecords', 'IX_GovernancePromotionRecords_TenantId');

SELECT
    ki.IndexName,
    ki.TableName,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM   sys.indexes    i
            JOIN   sys.tables     t ON t.object_id = i.object_id
            JOIN   sys.schemas    s ON s.schema_id = t.schema_id
            WHERE  i.name   = ki.IndexName
            AND    t.name   = ki.TableName
            AND    s.name   = 'dbo'
        )
        THEN 'PASS'
        ELSE 'MISS'
    END AS [Status]
FROM @KeyIndexes ki
ORDER BY ki.TableName, ki.IndexName;
PRINT '';

-- ── Informational: full table list ──────────────────────────────────────────

PRINT '-- Informational: all user tables in this database';
SELECT
    s.name + '.' + t.name AS TableName,
    p.rows                AS ApproxRowCount
FROM sys.tables    t
JOIN sys.schemas   s ON s.schema_id = t.schema_id
JOIN sys.partitions p ON p.object_id = t.object_id AND p.index_id IN (0, 1)
WHERE t.is_ms_shipped = 0
ORDER BY s.name, t.name;
PRINT '';

-- ── Informational: all foreign keys in this database ────────────────────────

PRINT '-- Informational: all foreign keys (check for any unexpected cross-DB references)';
SELECT
    fk.name                                                AS FKName,
    OBJECT_SCHEMA_NAME(fk.parent_object_id)                AS ParentSchema,
    OBJECT_NAME(fk.parent_object_id)                       AS ParentTable,
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id)  AS ParentColumn,
    OBJECT_SCHEMA_NAME(fk.referenced_object_id)            AS RefSchema,
    OBJECT_NAME(fk.referenced_object_id)                   AS RefTable,
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS RefColumn
FROM sys.foreign_keys        fk
JOIN sys.foreign_key_columns fkc ON fkc.constraint_object_id = fk.object_id
ORDER BY ParentTable, FKName;

PRINT '';
PRINT '============================================================';
PRINT ' Tenant Catalog verification complete.';
PRINT '============================================================';
