-- Read-only release preflight for migration 127 state columns.
-- Run with authorized read access against EACH relevant catalog, not a production mutation.
-- All three rows must report column_present=1, invalid_rows=0, and a trusted enabled check.
SET NOCOUNT ON;
DECLARE @checks TABLE (table_name sysname, column_name sysname, constraint_name sysname, valid_values nvarchar(300));
INSERT @checks VALUES
(N'FindingsSnapshots',N'GenerationStatus',N'CK_FindingsSnapshots_GenerationStatus',N'N''Generating'',N''Complete'',N''PartiallyComplete'',N''Failed'''),
(N'ArtifactBundles',N'Status',N'CK_ArtifactBundles_Status',N'N''Pending'',N''Available'',N''Partial'',N''Failed'',N''Archived'''),
(N'ArtifactBundleArtifacts',N'GenerationStatus',N'CK_ArtifactBundleArtifacts_GenerationStatus',N'N''Pending'',N''Generated'',N''Failed''');
DECLARE @results TABLE (table_name sysname,column_name sysname,column_present bit, trusted_enabled_check bit, invalid_rows bigint NULL);
DECLARE @t sysname,@c sysname,@k sysname,@v nvarchar(300),@qualified nvarchar(300),@sql nvarchar(max),@bad bigint,@present bit,@trusted bit;
DECLARE checks CURSOR LOCAL FAST_FORWARD FOR SELECT table_name,column_name,constraint_name,valid_values FROM @checks;
OPEN checks;
FETCH NEXT FROM checks INTO @t,@c,@k,@v;
WHILE @@FETCH_STATUS=0
BEGIN
    SET @qualified=N'dbo.'+QUOTENAME(@t);
    SET @present=CASE WHEN COL_LENGTH(@qualified,@c) IS NULL THEN 0 ELSE 1 END;
    SET @trusted=CASE WHEN EXISTS(SELECT 1 FROM sys.check_constraints WHERE parent_object_id=OBJECT_ID(@qualified) AND name=@k AND is_disabled=0 AND is_not_trusted=0) THEN 1 ELSE 0 END;
    SET @bad=NULL;
    IF @present=1
    BEGIN
        SET @sql=N'SELECT @n=COUNT_BIG(*) FROM '+@qualified+N' WHERE '+QUOTENAME(@c)+N' IS NULL OR LTRIM(RTRIM('+QUOTENAME(@c)+N')) NOT IN ('+@v+N');';
        EXEC sys.sp_executesql @sql,N'@n bigint OUTPUT',@n=@bad OUTPUT;
    END;
    INSERT @results VALUES(@t,@c,@present,@trusted,@bad);
    FETCH NEXT FROM checks INTO @t,@c,@k,@v;
END;
CLOSE checks;
DEALLOCATE checks;
SELECT * FROM @results ORDER BY table_name;
IF EXISTS(SELECT 1 FROM @results WHERE column_present=0 OR trusted_enabled_check=0 OR invalid_rows IS NULL OR invalid_rows<>0)
    THROW 51000,'Enum state preflight failed: assess missing schema, untrusted checks or corrupt states before deployment.',1;

-- The security-evidence mappers also require ten explicitly stored INT ordinals.
-- These original migrations did not install enum range checks, so measure the actual
-- declared SQL column shape and historical row values. This is not a schema change.
DECLARE @ordinal_fields TABLE (table_name sysname, column_name sysname, max_ordinal int, additional_ordinal int NULL);
INSERT @ordinal_fields VALUES
    (N'AzureInventoryDriftApprovals', N'Status', 2, NULL),
    (N'OperationalSecurityExceptions', N'Status', 2, NULL),
    (N'SecurityDeclaredConnections', N'Status', 2, NULL),
    (N'SecurityDeclaredConnections', N'RelationshipType', 1, NULL),
    (N'AzureInventoryBaselines', N'BaselineKind', 3, NULL),
    (N'SecurityAssetAssertions', N'Status', 2, NULL),
    (N'SecurityAssetAssertions', N'DataSensitivity', 5, NULL),
    (N'SecurityAssetAssertions', N'RegulatoryClass', 3, 99),
    (N'SecurityAssetAssertions', N'DeploymentEnvironment', 2, NULL),
    (N'SecurityAssetAssertions', N'BusinessCriticality', 4, NULL);

DECLARE @ordinal_results TABLE (
    table_name sysname, column_name sysname, nonnullable_int bit, invalid_rows bigint NULL
);
DECLARE @max_ordinal int, @additional int, @is_expected bit;
DECLARE ordinal_fields CURSOR LOCAL FAST_FORWARD FOR SELECT table_name, column_name, max_ordinal, additional_ordinal FROM @ordinal_fields;
OPEN ordinal_fields;
FETCH NEXT FROM ordinal_fields INTO @t, @c, @max_ordinal, @additional;
WHILE @@FETCH_STATUS = 0
BEGIN
    SET @qualified = N'dbo.' + QUOTENAME(@t);
    SET @is_expected = CASE WHEN EXISTS (
        SELECT 1 FROM sys.columns
        WHERE object_id = OBJECT_ID(@qualified, N'U') AND name = @c
            AND system_type_id = TYPE_ID(N'int') AND is_nullable = 0
    ) THEN 1 ELSE 0 END;
    SET @bad = NULL;
    IF @is_expected = 1
    BEGIN
        SET @sql = N'SELECT @n = COUNT_BIG(*) FROM ' + @qualified + N' WHERE ' + QUOTENAME(@c)
            + N' IS NULL OR (' + QUOTENAME(@c) + N' NOT BETWEEN 0 AND @maximum AND (@extra IS NULL OR '
            + QUOTENAME(@c) + N' <> @extra));';
        EXEC sys.sp_executesql @sql, N'@n bigint OUTPUT, @maximum int, @extra int', @n = @bad OUTPUT,
            @maximum = @max_ordinal, @extra = @additional;
    END;
    INSERT @ordinal_results VALUES (@t, @c, @is_expected, @bad);
    FETCH NEXT FROM ordinal_fields INTO @t, @c, @max_ordinal, @additional;
END;
CLOSE ordinal_fields;
DEALLOCATE ordinal_fields;
SELECT * FROM @ordinal_results ORDER BY table_name, column_name;
IF EXISTS (SELECT 1 FROM @ordinal_results WHERE nonnullable_int = 0 OR invalid_rows IS NULL OR invalid_rows <> 0)
    THROW 51001, 'Enum ordinal preflight failed: assess missing schema or corrupt security evidence states before deployment.', 1;
