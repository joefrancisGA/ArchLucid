using System.Diagnostics.CodeAnalysis;

using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Integrations;

/// <summary>
///     Non-RLS SQL access for ITSM correlation and finding-row updates (anonymous inbound webhooks have no session
///     scope).
/// </summary>
[ExcludeFromCodeCoverage(Justification = "SQL integration; exercised via API integration tests.")]
public sealed class SqlItsmFindingCorrelationRepository(
    IBackgroundWorkerSqlConnectionFactory connectionFactory,
    SqlResilientOperationExecutor sqlOperations) : IItsmFindingCorrelationRepository
{
    private const string CorrelationSelectColumns =
        "TenantId, WorkspaceId, ProjectId, FindingId, Provider, ExternalKey, ExternalSysId, CreatedUtc, FindingRecordId";

    private readonly IBackgroundWorkerSqlConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    private readonly SqlResilientOperationExecutor _sqlOperations =
        sqlOperations ?? throw new ArgumentNullException(nameof(sqlOperations));

    /// <inheritdoc />
    public Task<ItsmFindingCorrelationRecord?> TryGetByExternalKeyAsync(
        string provider,
        string externalKey,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => TryGetByExternalKeyCoreAsync(provider, externalKey, cancellationToken),
            ct);

    /// <inheritdoc />
    public Task<ItsmFindingCorrelationRecord?> TryGetByExternalKeyForTenantAsync(
        Guid tenantId,
        string provider,
        string externalKey,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => TryGetByExternalKeyForTenantCoreAsync(tenantId, provider, externalKey, cancellationToken),
            ct);

    /// <inheritdoc />
    public Task RegisterAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string findingId,
        string provider,
        string externalKey,
        string? externalSysId,
        Guid? findingRecordId,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => RegisterCoreAsync(
                tenantId,
                workspaceId,
                projectId,
                findingId,
                provider,
                externalKey,
                externalSysId,
                findingRecordId,
                cancellationToken),
            ct);

    /// <inheritdoc />
    public Task<Guid?> TryResolveFindingRecordIdForRunFindingAsync(
        Guid tenantId,
        Guid runId,
        string findingId,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => TryResolveFindingRecordIdForRunFindingCoreAsync(
                tenantId,
                runId,
                findingId,
                cancellationToken),
            ct);

    /// <inheritdoc />
    public Task<Guid?> TryResolveLatestCommittedFindingRecordIdAsync(
        Guid tenantId,
        string findingId,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => TryResolveLatestCommittedFindingRecordIdCoreAsync(
                tenantId,
                findingId,
                cancellationToken),
            ct);

    /// <inheritdoc />
    public Task<ItsmFindingCorrelationUpdateResult> UpdateExternalTrackingAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string findingId,
        string provider,
        string externalKey,
        string? externalSysId,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => UpdateExternalTrackingCoreAsync(
                tenantId,
                workspaceId,
                projectId,
                findingId,
                provider,
                externalKey,
                externalSysId,
                cancellationToken),
            ct);

    /// <inheritdoc />
    public Task<ItsmFindingCorrelationRecord?> RemoveByFindingAndProviderAsync(
        Guid tenantId,
        string findingId,
        string provider,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => RemoveByFindingAndProviderCoreAsync(tenantId, findingId, provider, cancellationToken),
            ct);

    /// <inheritdoc />
    public Task<int> UpdateHumanReviewStatusForFindingAsync(
        Guid tenantId,
        string findingId,
        string humanReviewStatus,
        Guid? findingRecordId,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => UpdateHumanReviewStatusForFindingCoreAsync(
                tenantId,
                findingId,
                humanReviewStatus,
                findingRecordId,
                cancellationToken),
            ct);

    /// <inheritdoc />
    public Task<bool> FindingRecordExistsAsync(
        Guid tenantId,
        string findingId,
        Guid? findingRecordId,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => FindingRecordExistsCoreAsync(tenantId, findingId, findingRecordId, cancellationToken),
            ct);

    /// <inheritdoc />
    public Task<ItsmFindingCorrelationRecord?> TryGetByFindingAndProviderAsync(
        Guid tenantId,
        string findingId,
        string provider,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => TryGetByFindingAndProviderCoreAsync(tenantId, findingId, provider, cancellationToken),
            ct);

    /// <inheritdoc />
    public Task<IReadOnlyList<ItsmFindingCorrelationRecord>> ListByFindingAsync(
        Guid tenantId,
        string findingId,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => ListByFindingCoreAsync(tenantId, findingId, cancellationToken),
            ct);

    /// <inheritdoc />
    public Task<IReadOnlyList<ItsmFindingCorrelationRecord>> ListByFindingsAsync(
        Guid tenantId,
        IReadOnlyList<string> findingIds,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => ListByFindingsCoreAsync(tenantId, findingIds, cancellationToken),
            ct);

    private async Task<ItsmFindingCorrelationRecord?> TryGetByExternalKeyCoreAsync(
        string provider,
        string externalKey,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(provider))
            throw new ArgumentException("provider is required.", nameof(provider));

        if (string.IsNullOrWhiteSpace(externalKey))
            throw new ArgumentException("externalKey is required.", nameof(externalKey));

        const string sql = $"""
                           SELECT {CorrelationSelectColumns}
                           FROM dbo.ItsmFindingCorrelations
                           WHERE Provider = @Provider AND ExternalKey = @ExternalKey;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition cmd = new(
            sql,
            new { Provider = provider.Trim(), ExternalKey = externalKey.Trim() },
            cancellationToken: ct);

        List<ItsmFindingCorrelationRecord> matches =
            (await connection.QueryAsync<ItsmFindingCorrelationRecord>(cmd)).ToList();

        // Anonymous inbound webhooks have no tenant context; resolve only when unambiguous.
        if (matches.Count != 1)
            return null;

        return matches[0];
    }

    private async Task<ItsmFindingCorrelationRecord?> TryGetByExternalKeyForTenantCoreAsync(
        Guid tenantId,
        string provider,
        string externalKey,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (string.IsNullOrWhiteSpace(provider))
            throw new ArgumentException("provider is required.", nameof(provider));

        if (string.IsNullOrWhiteSpace(externalKey))
            throw new ArgumentException("externalKey is required.", nameof(externalKey));

        const string sql = $"""
                           SELECT {CorrelationSelectColumns}
                           FROM dbo.ItsmFindingCorrelations
                           WHERE TenantId = @TenantId AND Provider = @Provider AND ExternalKey = @ExternalKey;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition cmd = new(
            sql,
            new
            {
                TenantId = tenantId,
                Provider = provider.Trim(),
                ExternalKey = externalKey.Trim()
            },
            cancellationToken: ct);

        return await connection.QuerySingleOrDefaultAsync<ItsmFindingCorrelationRecord>(cmd);
    }

    private async Task RegisterCoreAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string findingId,
        string provider,
        string externalKey,
        string? externalSysId,
        Guid? findingRecordId,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("tenantId is required.", nameof(tenantId));
        if (string.IsNullOrWhiteSpace(findingId)) throw new ArgumentException("findingId is required.", nameof(findingId));
        if (string.IsNullOrWhiteSpace(provider)) throw new ArgumentException("provider is required.", nameof(provider));
        if (string.IsNullOrWhiteSpace(externalKey)) throw new ArgumentException("externalKey is required.", nameof(externalKey));

        const string sql = """
                           IF NOT EXISTS (
                               SELECT 1 FROM dbo.ItsmFindingCorrelations
                               WHERE TenantId = @TenantId
                                 AND Provider = @Provider
                                 AND ExternalKey = @ExternalKey)
                           BEGIN
                               INSERT INTO dbo.ItsmFindingCorrelations
                                   (TenantId, WorkspaceId, ProjectId, FindingId, Provider, ExternalKey, ExternalSysId, FindingRecordId)
                               VALUES
                                   (@TenantId, @WorkspaceId, @ProjectId, @FindingId, @Provider, @ExternalKey, @ExternalSysId, @FindingRecordId);
                           END
                           ELSE IF @FindingRecordId IS NOT NULL
                           BEGIN
                               UPDATE dbo.ItsmFindingCorrelations
                               SET FindingRecordId = @FindingRecordId
                               WHERE TenantId = @TenantId
                                 AND Provider = @Provider
                                 AND ExternalKey = @ExternalKey
                                 AND FindingRecordId IS NULL;
                           END
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition cmd = new(
            sql,
            new
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                FindingId = findingId.Trim(),
                Provider = provider.Trim(),
                ExternalKey = externalKey.Trim(),
                ExternalSysId = string.IsNullOrWhiteSpace(externalSysId) ? null : externalSysId.Trim(),
                FindingRecordId = findingRecordId
            },
            cancellationToken: ct);

        await connection.ExecuteAsync(cmd);
    }

    private async Task<ItsmFindingCorrelationUpdateResult> UpdateExternalTrackingCoreAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string findingId,
        string provider,
        string externalKey,
        string? externalSysId,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("tenantId is required.", nameof(tenantId));
        if (string.IsNullOrWhiteSpace(findingId)) throw new ArgumentException("findingId is required.", nameof(findingId));
        if (string.IsNullOrWhiteSpace(provider)) throw new ArgumentException("provider is required.", nameof(provider));
        if (string.IsNullOrWhiteSpace(externalKey)) throw new ArgumentException("externalKey is required.", nameof(externalKey));

        string trimmedFinding = findingId.Trim();
        string trimmedProvider = provider.Trim();
        string trimmedExternalKey = externalKey.Trim();
        string? trimmedExternalSysId = string.IsNullOrWhiteSpace(externalSysId) ? null : externalSysId.Trim();

        ItsmFindingCorrelationRecord? prior =
            await TryGetByFindingAndProviderCoreAsync(tenantId, trimmedFinding, trimmedProvider, ct);

        if (prior is null)
            return ItsmFindingCorrelationUpdateResult.NotFound;

        bool externalKeyChanged = !string.Equals(prior.ExternalKey, trimmedExternalKey, StringComparison.Ordinal);
        bool externalSysIdChanged = !string.Equals(prior.ExternalSysId, trimmedExternalSysId, StringComparison.Ordinal);

        if (!externalKeyChanged && !externalSysIdChanged)
        {
            return new ItsmFindingCorrelationUpdateResult
            {
                Status = ItsmFindingCorrelationUpdateStatus.Unchanged,
                Prior = prior,
                Current = prior
            };
        }

        if (externalKeyChanged)
        {
            const string conflictSql = """
                                       SELECT CASE WHEN EXISTS (
                                           SELECT 1
                                           FROM dbo.ItsmFindingCorrelations
                                           WHERE TenantId = @TenantId
                                             AND Provider = @Provider
                                             AND ExternalKey = @ExternalKey
                                             AND FindingId <> @FindingId
                                       ) THEN 1 ELSE 0 END;
                                       """;

            await using SqlConnection conflictConnection = await _connectionFactory.CreateOpenConnectionAsync(ct);

            CommandDefinition conflictCmd = new(
                conflictSql,
                new
                {
                    TenantId = tenantId,
                    Provider = trimmedProvider,
                    ExternalKey = trimmedExternalKey,
                    FindingId = trimmedFinding
                },
                cancellationToken: ct);

            int conflict = await conflictConnection.ExecuteScalarAsync<int>(conflictCmd);

            if (conflict != 0)
                return ItsmFindingCorrelationUpdateResult.ExternalKeyConflict;
        }

        const string updateSql = """
                                 UPDATE dbo.ItsmFindingCorrelations
                                 SET WorkspaceId = @WorkspaceId,
                                     ProjectId = @ProjectId,
                                     ExternalKey = @ExternalKey,
                                     ExternalSysId = @ExternalSysId
                                 WHERE TenantId = @TenantId
                                   AND FindingId = @FindingId
                                   AND Provider = @Provider;
                                 """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition updateCmd = new(
            updateSql,
            new
            {
                TenantId = tenantId,
                WorkspaceId = workspaceId,
                ProjectId = projectId,
                FindingId = trimmedFinding,
                Provider = trimmedProvider,
                ExternalKey = trimmedExternalKey,
                ExternalSysId = trimmedExternalSysId
            },
            cancellationToken: ct);

        await connection.ExecuteAsync(updateCmd);

        ItsmFindingCorrelationRecord current = new()
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
            FindingId = trimmedFinding,
            Provider = trimmedProvider,
            ExternalKey = trimmedExternalKey,
            ExternalSysId = trimmedExternalSysId,
            FindingRecordId = prior.FindingRecordId,
            CreatedUtc = prior.CreatedUtc
        };

        return new ItsmFindingCorrelationUpdateResult
        {
            Status = ItsmFindingCorrelationUpdateStatus.Updated,
            Prior = prior,
            Current = current
        };
    }

    private async Task<ItsmFindingCorrelationRecord?> RemoveByFindingAndProviderCoreAsync(
        Guid tenantId,
        string findingId,
        string provider,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("tenantId is required.", nameof(tenantId));
        if (string.IsNullOrWhiteSpace(findingId)) throw new ArgumentException("findingId is required.", nameof(findingId));
        if (string.IsNullOrWhiteSpace(provider)) throw new ArgumentException("provider is required.", nameof(provider));

        string trimmedFinding = findingId.Trim();
        string trimmedProvider = provider.Trim();

        ItsmFindingCorrelationRecord? prior =
            await TryGetByFindingAndProviderCoreAsync(tenantId, trimmedFinding, trimmedProvider, ct);

        if (prior is null)
            return null;

        const string deleteSql = """
                                 DELETE FROM dbo.ItsmFindingCorrelations
                                 WHERE TenantId = @TenantId
                                   AND FindingId = @FindingId
                                   AND Provider = @Provider;
                                 """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition deleteCmd = new(
            deleteSql,
            new { TenantId = tenantId, FindingId = trimmedFinding, Provider = trimmedProvider },
            cancellationToken: ct);

        await connection.ExecuteAsync(deleteCmd);

        return prior;
    }

    private async Task<int> UpdateHumanReviewStatusForFindingCoreAsync(
        Guid tenantId,
        string findingId,
        string humanReviewStatus,
        Guid? findingRecordId,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("tenantId is required.", nameof(tenantId));
        if (string.IsNullOrWhiteSpace(findingId)) throw new ArgumentException("findingId is required.", nameof(findingId));
        if (string.IsNullOrWhiteSpace(humanReviewStatus))
            throw new ArgumentException("humanReviewStatus is required.", nameof(humanReviewStatus));

        string sql = findingRecordId is Guid scopedRecordId
            ? """
              UPDATE dbo.FindingRecords
              SET HumanReviewStatus = @HumanReviewStatus,
                  ReviewedAtUtc = SYSUTCDATETIME(),
                  ReviewedByUserId = COALESCE(ReviewedByUserId, N'itsm-webhook')
              WHERE TenantId = @TenantId AND FindingRecordId = @FindingRecordId;
              """
            : """
              UPDATE fr
              SET fr.HumanReviewStatus = @HumanReviewStatus,
                  fr.ReviewedAtUtc = SYSUTCDATETIME(),
                  fr.ReviewedByUserId = COALESCE(fr.ReviewedByUserId, N'itsm-webhook')
              FROM dbo.FindingRecords AS fr
              INNER JOIN (
                  SELECT TOP (1) fr2.FindingRecordId
                  FROM dbo.FindingRecords AS fr2
                  INNER JOIN dbo.FindingsSnapshots AS fs ON fs.FindingsSnapshotId = fr2.FindingsSnapshotId
                  INNER JOIN dbo.Runs AS r ON r.RunId = fs.RunId
                  WHERE fr2.TenantId = @TenantId
                    AND fr2.FindingId = @FindingId
                    AND r.GoldenManifestId IS NOT NULL
                    AND r.ArchivedUtc IS NULL
                  ORDER BY COALESCE(r.CompletedUtc, r.CreatedUtc) DESC, fr2.FindingRecordId DESC
              ) AS target ON target.FindingRecordId = fr.FindingRecordId
              WHERE fr.TenantId = @TenantId;
              """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition cmd = new(
            sql,
            new
            {
                TenantId = tenantId,
                FindingId = findingId.Trim(),
                HumanReviewStatus = humanReviewStatus.Trim(),
                FindingRecordId = findingRecordId
            },
            cancellationToken: ct);

        return await connection.ExecuteAsync(cmd);
    }

    private async Task<bool> FindingRecordExistsCoreAsync(
        Guid tenantId,
        string findingId,
        Guid? findingRecordId,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("tenantId is required.", nameof(tenantId));
        if (string.IsNullOrWhiteSpace(findingId)) throw new ArgumentException("findingId is required.", nameof(findingId));

        string sql = findingRecordId is Guid scopedRecordId
            ? """
              SELECT CASE WHEN EXISTS (
                  SELECT 1
                  FROM dbo.FindingRecords
                  WHERE TenantId = @TenantId AND FindingRecordId = @FindingRecordId
              ) THEN 1 ELSE 0 END;
              """
            : """
              SELECT CASE WHEN EXISTS (
                  SELECT 1
                  FROM dbo.FindingRecords
                  WHERE TenantId = @TenantId AND FindingId = @FindingId
              ) THEN 1 ELSE 0 END;
              """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition cmd = new(
            sql,
            new
            {
                TenantId = tenantId,
                FindingId = findingId.Trim(),
                FindingRecordId = findingRecordId
            },
            cancellationToken: ct);

        int exists = await connection.ExecuteScalarAsync<int>(cmd);

        return exists != 0;
    }

    private async Task<Guid?> TryResolveFindingRecordIdForRunFindingCoreAsync(
        Guid tenantId,
        Guid runId,
        string findingId,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("tenantId is required.", nameof(tenantId));
        if (runId == Guid.Empty) throw new ArgumentException("runId is required.", nameof(runId));
        if (string.IsNullOrWhiteSpace(findingId)) throw new ArgumentException("findingId is required.", nameof(findingId));

        const string sql = """
                           SELECT TOP (1) fr.FindingRecordId
                           FROM dbo.FindingRecords AS fr
                           INNER JOIN dbo.FindingsSnapshots AS fs ON fs.FindingsSnapshotId = fr.FindingsSnapshotId
                           INNER JOIN dbo.Runs AS r ON r.RunId = fs.RunId
                           WHERE fr.TenantId = @TenantId
                             AND r.RunId = @RunId
                             AND fr.FindingId = @FindingId
                             AND r.ArchivedUtc IS NULL;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition cmd = new(
            sql,
            new { TenantId = tenantId, RunId = runId, FindingId = findingId.Trim() },
            cancellationToken: ct);

        return await connection.QuerySingleOrDefaultAsync<Guid?>(cmd);
    }

    private async Task<Guid?> TryResolveLatestCommittedFindingRecordIdCoreAsync(
        Guid tenantId,
        string findingId,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("tenantId is required.", nameof(tenantId));
        if (string.IsNullOrWhiteSpace(findingId)) throw new ArgumentException("findingId is required.", nameof(findingId));

        const string sql = """
                           SELECT TOP (1) fr.FindingRecordId
                           FROM dbo.FindingRecords AS fr
                           INNER JOIN dbo.FindingsSnapshots AS fs ON fs.FindingsSnapshotId = fr.FindingsSnapshotId
                           INNER JOIN dbo.Runs AS r ON r.RunId = fs.RunId
                           WHERE fr.TenantId = @TenantId
                             AND fr.FindingId = @FindingId
                             AND r.GoldenManifestId IS NOT NULL
                             AND r.ArchivedUtc IS NULL
                           ORDER BY COALESCE(r.CompletedUtc, r.CreatedUtc) DESC, fr.FindingRecordId DESC;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition cmd = new(
            sql,
            new { TenantId = tenantId, FindingId = findingId.Trim() },
            cancellationToken: ct);

        return await connection.QuerySingleOrDefaultAsync<Guid?>(cmd);
    }

    private async Task<ItsmFindingCorrelationRecord?> TryGetByFindingAndProviderCoreAsync(
        Guid tenantId,
        string findingId,
        string provider,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("tenantId is required.", nameof(tenantId));
        if (string.IsNullOrWhiteSpace(findingId)) throw new ArgumentException("findingId is required.", nameof(findingId));
        if (string.IsNullOrWhiteSpace(provider)) throw new ArgumentException("provider is required.", nameof(provider));

        const string sql = $"""
                           SELECT TOP (1) {CorrelationSelectColumns}
                           FROM dbo.ItsmFindingCorrelations
                           WHERE TenantId = @TenantId AND FindingId = @FindingId AND Provider = @Provider
                           ORDER BY CreatedUtc DESC;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition cmd = new(
            sql,
            new { TenantId = tenantId, FindingId = findingId.Trim(), Provider = provider.Trim() },
            cancellationToken: ct);

        return await connection.QuerySingleOrDefaultAsync<ItsmFindingCorrelationRecord>(cmd);
    }

    private async Task<IReadOnlyList<ItsmFindingCorrelationRecord>> ListByFindingCoreAsync(
        Guid tenantId,
        string findingId,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("tenantId is required.", nameof(tenantId));
        if (string.IsNullOrWhiteSpace(findingId)) throw new ArgumentException("findingId is required.", nameof(findingId));

        const string sql = $"""
                           SELECT {CorrelationSelectColumns}
                           FROM dbo.ItsmFindingCorrelations
                           WHERE TenantId = @TenantId AND FindingId = @FindingId
                           ORDER BY CreatedUtc ASC;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition cmd = new(
            sql,
            new { TenantId = tenantId, FindingId = findingId.Trim() },
            cancellationToken: ct);

        IEnumerable<ItsmFindingCorrelationRecord> rows =
            await connection.QueryAsync<ItsmFindingCorrelationRecord>(cmd);

        return rows.ToList();
    }

    private async Task<IReadOnlyList<ItsmFindingCorrelationRecord>> ListByFindingsCoreAsync(
        Guid tenantId,
        IReadOnlyList<string> findingIds,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty)
            throw new ArgumentException("tenantId is required.", nameof(tenantId));

        if (findingIds is null)
            throw new ArgumentNullException(nameof(findingIds));

        List<string> normalizedFindingIds = findingIds
            .Where(static id => !string.IsNullOrWhiteSpace(id))
            .Select(static id => id.Trim())
            .Distinct(StringComparer.Ordinal)
            .ToList();

        if (normalizedFindingIds.Count == 0)
            return Array.Empty<ItsmFindingCorrelationRecord>();

        const string sql = $"""
                           SELECT {CorrelationSelectColumns}
                           FROM dbo.ItsmFindingCorrelations
                           WHERE TenantId = @TenantId AND FindingId IN @FindingIds
                           ORDER BY FindingId ASC, CreatedUtc ASC;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition cmd = new(
            sql,
            new { TenantId = tenantId, FindingIds = normalizedFindingIds },
            cancellationToken: ct);

        IEnumerable<ItsmFindingCorrelationRecord> rows =
            await connection.QueryAsync<ItsmFindingCorrelationRecord>(cmd);

        return rows.ToList();
    }
}
