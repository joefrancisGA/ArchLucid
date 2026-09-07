using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Operations;
using ArchLucid.Persistence.Data.Infrastructure;
using ArchLucid.Persistence.Data.Repositories;

using Dapper;

namespace ArchLucid.Persistence.Planning;

/// <inheritdoc cref="IAdvisoryDraftOperationRepository" />
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via ArchLucid.sql / DbUp.")]
public sealed class DapperAdvisoryDraftOperationRepository(IDbConnectionFactory connectionFactory)
    : IAdvisoryDraftOperationRepository
{
    private readonly IDbConnectionFactory _connectionFactory =
        connectionFactory ?? throw new ArgumentNullException(nameof(connectionFactory));

    /// <inheritdoc />
    public async Task<AdvisoryDraftOperationRow?> GetAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        Guid operationId,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT TenantId,
                                  WorkspaceId,
                                  ProjectId,
                                  OperationId,
                                  State,
                                  StepLabel,
                                  CurrentStep,
                                  CreatedUtc,
                                  HeartbeatUtc,
                                  CompletedUtc,
                                  ResultJson,
                                  ErrorMessage
                           FROM dbo.AdvisoryDraftOperations
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND OperationId = @OperationId
                           """;

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.QueryFirstOrDefaultAsync<AdvisoryDraftOperationRow>(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    ProjectId = projectId,
                    OperationId = operationId,
                },
                cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task<bool> TryInsertPendingAsync(
        AdvisoryDraftOperationRow row,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(row);

        const string sql = """
                           IF NOT EXISTS (
                               SELECT 1
                               FROM dbo.AdvisoryDraftOperations
                               WHERE TenantId = @TenantId
                                 AND WorkspaceId = @WorkspaceId
                                 AND ProjectId = @ProjectId
                                 AND OperationId = @OperationId)
                           BEGIN
                               INSERT INTO dbo.AdvisoryDraftOperations
                                   (TenantId, WorkspaceId, ProjectId, OperationId, State, StepLabel, CurrentStep,
                                    CreatedUtc, HeartbeatUtc, CompletedUtc, ResultJson, ErrorMessage)
                               VALUES
                                   (@TenantId, @WorkspaceId, @ProjectId, @OperationId, @State, @StepLabel, @CurrentStep,
                                    @CreatedUtc, @HeartbeatUtc, @CompletedUtc, @ResultJson, @ErrorMessage);
                               SELECT CAST(1 AS BIT);
                           END
                           ELSE
                               SELECT CAST(0 AS BIT);
                           """;

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.ExecuteScalarAsync<bool>(
            new CommandDefinition(
                sql,
                new
                {
                    row.TenantId,
                    row.WorkspaceId,
                    row.ProjectId,
                    row.OperationId,
                    State = (int)row.State,
                    row.StepLabel,
                    row.CurrentStep,
                    CreatedUtc = row.CreatedUtc.UtcDateTime,
                    HeartbeatUtc = row.HeartbeatUtc.UtcDateTime,
                    CompletedUtc = row.CompletedUtc?.UtcDateTime,
                    row.ResultJson,
                    row.ErrorMessage,
                },
                cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task<AdvisoryDraftOperationRow?> GetByOperationIdAsync(
        Guid operationId,
        CancellationToken cancellationToken)
    {
        const string sql = """
                           SELECT TenantId,
                                  WorkspaceId,
                                  ProjectId,
                                  OperationId,
                                  State,
                                  StepLabel,
                                  CurrentStep,
                                  CreatedUtc,
                                  HeartbeatUtc,
                                  CompletedUtc,
                                  ResultJson,
                                  ErrorMessage
                           FROM dbo.AdvisoryDraftOperations
                           WHERE OperationId = @OperationId
                           """;

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.QueryFirstOrDefaultAsync<AdvisoryDraftOperationRow>(
            new CommandDefinition(
                sql,
                new { OperationId = operationId },
                cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task UpdateAsync(
        AdvisoryDraftOperationRow row,
        CancellationToken cancellationToken)
    {
        ArgumentNullException.ThrowIfNull(row);

        const string sql = """
                           UPDATE dbo.AdvisoryDraftOperations
                           SET State = @State,
                               StepLabel = @StepLabel,
                               CurrentStep = @CurrentStep,
                               HeartbeatUtc = @HeartbeatUtc,
                               CompletedUtc = @CompletedUtc,
                               ResultJson = @ResultJson,
                               ErrorMessage = @ErrorMessage
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND ProjectId = @ProjectId
                             AND OperationId = @OperationId
                           """;

        using IDbConnection connection = await _connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    row.TenantId,
                    row.WorkspaceId,
                    row.ProjectId,
                    row.OperationId,
                    State = (int)row.State,
                    row.StepLabel,
                    row.CurrentStep,
                    HeartbeatUtc = row.HeartbeatUtc.UtcDateTime,
                    CompletedUtc = row.CompletedUtc?.UtcDateTime,
                    row.ResultJson,
                    row.ErrorMessage,
                },
                cancellationToken: cancellationToken));
    }
}
