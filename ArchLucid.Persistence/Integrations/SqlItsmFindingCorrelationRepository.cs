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
    public Task RegisterAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        string findingId,
        string provider,
        string externalKey,
        string? externalSysId,
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
                cancellationToken),
            ct);

    /// <inheritdoc />
    public Task<int> UpdateHumanReviewStatusForFindingAsync(
        Guid tenantId,
        string findingId,
        string humanReviewStatus,
        CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => UpdateHumanReviewStatusForFindingCoreAsync(
                tenantId,
                findingId,
                humanReviewStatus,
                cancellationToken),
            ct);

    /// <inheritdoc />
    public Task<bool> FindingRecordExistsAsync(Guid tenantId, string findingId, CancellationToken ct) =>
        _sqlOperations.ExecuteAsync(
            cancellationToken => FindingRecordExistsCoreAsync(tenantId, findingId, cancellationToken),
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

        const string sql = """
                           SELECT TenantId, WorkspaceId, ProjectId, FindingId
                           FROM dbo.ItsmFindingCorrelations
                           WHERE Provider = @Provider AND ExternalKey = @ExternalKey;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition cmd = new(
            sql,
            new { Provider = provider.Trim(), ExternalKey = externalKey.Trim() },
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
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("tenantId is required.", nameof(tenantId));
        if (string.IsNullOrWhiteSpace(findingId)) throw new ArgumentException("findingId is required.", nameof(findingId));
        if (string.IsNullOrWhiteSpace(provider)) throw new ArgumentException("provider is required.", nameof(provider));
        if (string.IsNullOrWhiteSpace(externalKey)) throw new ArgumentException("externalKey is required.", nameof(externalKey));

        const string sql = """
                           IF NOT EXISTS (
                               SELECT 1 FROM dbo.ItsmFindingCorrelations
                               WHERE Provider = @Provider AND ExternalKey = @ExternalKey)
                           BEGIN
                               INSERT INTO dbo.ItsmFindingCorrelations
                                   (TenantId, WorkspaceId, ProjectId, FindingId, Provider, ExternalKey, ExternalSysId)
                               VALUES
                                   (@TenantId, @WorkspaceId, @ProjectId, @FindingId, @Provider, @ExternalKey, @ExternalSysId);
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
                ExternalSysId = string.IsNullOrWhiteSpace(externalSysId) ? null : externalSysId.Trim()
            },
            cancellationToken: ct);

        await connection.ExecuteAsync(cmd);
    }

    private async Task<int> UpdateHumanReviewStatusForFindingCoreAsync(
        Guid tenantId,
        string findingId,
        string humanReviewStatus,
        CancellationToken ct)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("tenantId is required.", nameof(tenantId));
        if (string.IsNullOrWhiteSpace(findingId)) throw new ArgumentException("findingId is required.", nameof(findingId));
        if (string.IsNullOrWhiteSpace(humanReviewStatus))
            throw new ArgumentException("humanReviewStatus is required.", nameof(humanReviewStatus));

        const string sql = """
                           UPDATE dbo.FindingRecords
                           SET HumanReviewStatus = @HumanReviewStatus,
                               ReviewedAtUtc = SYSUTCDATETIME(),
                               ReviewedByUserId = COALESCE(ReviewedByUserId, N'itsm-webhook')
                           WHERE TenantId = @TenantId AND FindingId = @FindingId;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition cmd = new(
            sql,
            new { TenantId = tenantId, FindingId = findingId.Trim(), HumanReviewStatus = humanReviewStatus.Trim() },
            cancellationToken: ct);

        return await connection.ExecuteAsync(cmd);
    }

    private async Task<bool> FindingRecordExistsCoreAsync(Guid tenantId, string findingId, CancellationToken ct)
    {
        if (tenantId == Guid.Empty) throw new ArgumentException("tenantId is required.", nameof(tenantId));
        if (string.IsNullOrWhiteSpace(findingId)) throw new ArgumentException("findingId is required.", nameof(findingId));

        const string sql = """
                           SELECT CASE WHEN EXISTS (
                               SELECT 1
                               FROM dbo.FindingRecords
                               WHERE TenantId = @TenantId AND FindingId = @FindingId
                           ) THEN 1 ELSE 0 END;
                           """;

        await using SqlConnection connection = await _connectionFactory.CreateOpenConnectionAsync(ct);

        CommandDefinition cmd = new(sql, new { TenantId = tenantId, FindingId = findingId.Trim() }, cancellationToken: ct);

        int exists = await connection.ExecuteScalarAsync<int>(cmd);

        return exists != 0;
    }
}
