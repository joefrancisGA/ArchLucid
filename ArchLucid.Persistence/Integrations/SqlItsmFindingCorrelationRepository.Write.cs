using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Integrations;

public sealed partial class SqlItsmFindingCorrelationRepository
{
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
}
