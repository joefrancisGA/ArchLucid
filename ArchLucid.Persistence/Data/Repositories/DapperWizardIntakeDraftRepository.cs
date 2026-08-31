using System.Data;
using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Intake;
using ArchLucid.Persistence.Data.Infrastructure;

using Dapper;

namespace ArchLucid.Persistence.Data.Repositories;

/// <inheritdoc cref="IWizardIntakeDraftRepository" />
[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; exercised via ArchLucid.sql / DbUp.")]
public sealed class DapperWizardIntakeDraftRepository(IDbConnectionFactory connectionFactory)
    : IWizardIntakeDraftRepository
{
    /// <inheritdoc />
    public async Task<WizardIntakeDraftResponse?> GetAsync(
        Guid tenantId,
        Guid workspaceId,
        string wizardId,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(wizardId);

        const string sql = """
                           SELECT WizardId, StepIndex, StateJson, UpdatedUtc
                           FROM dbo.WizardIntakeDrafts
                           WHERE TenantId = @TenantId
                             AND WorkspaceId = @WorkspaceId
                             AND WizardId = @WizardId
                           """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        return await connection.QueryFirstOrDefaultAsync<WizardIntakeDraftResponse>(
            new CommandDefinition(
                sql,
                new { TenantId = tenantId, WorkspaceId = workspaceId, WizardId = wizardId },
                cancellationToken: cancellationToken));
    }

    /// <inheritdoc />
    public async Task UpsertAsync(
        Guid tenantId,
        Guid workspaceId,
        string wizardId,
        int stepIndex,
        string stateJson,
        byte[]? idempotencyKeyHash,
        DateTime updatedUtc,
        CancellationToken cancellationToken)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(wizardId);
        ArgumentNullException.ThrowIfNull(stateJson);

        const string sql = """
                           MERGE dbo.WizardIntakeDrafts AS target
                           USING (SELECT @TenantId AS TenantId, @WorkspaceId AS WorkspaceId, @WizardId AS WizardId) AS source
                           ON target.TenantId = source.TenantId
                              AND target.WorkspaceId = source.WorkspaceId
                              AND target.WizardId = source.WizardId
                           WHEN MATCHED THEN
                               UPDATE SET StepIndex = @StepIndex,
                                          StateJson = @StateJson,
                                          IdempotencyKeyHash = @IdempotencyKeyHash,
                                          UpdatedUtc = @UpdatedUtc
                           WHEN NOT MATCHED THEN
                               INSERT (TenantId, WorkspaceId, WizardId, StepIndex, StateJson, IdempotencyKeyHash, UpdatedUtc)
                               VALUES (@TenantId, @WorkspaceId, @WizardId, @StepIndex, @StateJson, @IdempotencyKeyHash, @UpdatedUtc);
                           """;

        using IDbConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                sql,
                new
                {
                    TenantId = tenantId,
                    WorkspaceId = workspaceId,
                    WizardId = wizardId,
                    StepIndex = stepIndex,
                    StateJson = stateJson,
                    IdempotencyKeyHash = idempotencyKeyHash,
                    UpdatedUtc = updatedUtc,
                },
                cancellationToken: cancellationToken));
    }
}
