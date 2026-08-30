using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.Governance;
using ArchLucid.Core.Persistence.Ports;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Governance;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
public sealed class DapperGovernanceEnvironmentCatalogRepository(ISqlConnectionFactory connectionFactory)
    : IGovernanceEnvironmentCatalogRepository
{
    public async Task<GovernanceEnvironmentCatalog?> GetByScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        CancellationToken cancellationToken = default)
    {
        const string environmentsSql = """
            SELECT Slug, DisplayName, SortOrder, IsActive
            FROM dbo.GovernanceEnvironmentDefinitions
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
            ORDER BY SortOrder, DisplayName;
            """;

        const string transitionsSql = """
            SELECT SourceSlug, TargetSlug
            FROM dbo.GovernanceEnvironmentTransitions
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId
            ORDER BY SourceSlug, TargetSlug;
            """;

        object parameters = new
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
        };

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        IReadOnlyList<GovernanceEnvironmentDefinition> environments = (await connection
            .QueryAsync<GovernanceEnvironmentDefinition>(
                new CommandDefinition(environmentsSql, parameters, cancellationToken: cancellationToken))
            .ConfigureAwait(false)).AsList();

        if (environments.Count == 0)
            return null;

        IReadOnlyList<GovernanceEnvironmentTransition> transitions = (await connection
            .QueryAsync<GovernanceEnvironmentTransition>(
                new CommandDefinition(transitionsSql, parameters, cancellationToken: cancellationToken))
            .ConfigureAwait(false)).AsList();

        return new GovernanceEnvironmentCatalog
        {
            Environments = environments,
            Transitions = transitions,
        };
    }

    public async Task ReplaceForScopeAsync(
        Guid tenantId,
        Guid workspaceId,
        Guid projectId,
        GovernanceEnvironmentCatalog catalog,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(catalog);

        const string deleteTransitionsSql = """
            DELETE FROM dbo.GovernanceEnvironmentTransitions
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId;
            """;

        const string deleteDefinitionsSql = """
            DELETE FROM dbo.GovernanceEnvironmentDefinitions
            WHERE TenantId = @TenantId
              AND WorkspaceId = @WorkspaceId
              AND ProjectId = @ProjectId;
            """;

        const string insertDefinitionSql = """
            INSERT INTO dbo.GovernanceEnvironmentDefinitions
            (
                EnvironmentDefinitionId, TenantId, WorkspaceId, ProjectId,
                Slug, DisplayName, SortOrder, IsActive, CreatedUtc, LastModifiedUtc
            )
            VALUES
            (
                @EnvironmentDefinitionId, @TenantId, @WorkspaceId, @ProjectId,
                @Slug, @DisplayName, @SortOrder, @IsActive, @CreatedUtc, @LastModifiedUtc
            );
            """;

        const string insertTransitionSql = """
            INSERT INTO dbo.GovernanceEnvironmentTransitions
            (
                TransitionId, TenantId, WorkspaceId, ProjectId, SourceSlug, TargetSlug
            )
            VALUES
            (
                @TransitionId, @TenantId, @WorkspaceId, @ProjectId, @SourceSlug, @TargetSlug
            );
            """;

        object scopeParameters = new
        {
            TenantId = tenantId,
            WorkspaceId = workspaceId,
            ProjectId = projectId,
        };

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        await using SqlTransaction transaction = (SqlTransaction)await connection
            .BeginTransactionAsync(cancellationToken)
            .ConfigureAwait(false);

        try
        {
            await connection.ExecuteAsync(
                new CommandDefinition(deleteTransitionsSql, scopeParameters, transaction, cancellationToken: cancellationToken))
                .ConfigureAwait(false);

            await connection.ExecuteAsync(
                new CommandDefinition(deleteDefinitionsSql, scopeParameters, transaction, cancellationToken: cancellationToken))
                .ConfigureAwait(false);

            DateTime createdUtc = TimeProvider.System.UtcNowDateTime();

            foreach (GovernanceEnvironmentDefinition environment in catalog.Environments)
            {
                await connection.ExecuteAsync(
                    new CommandDefinition(
                        insertDefinitionSql,
                        new
                        {
                            EnvironmentDefinitionId = Guid.NewGuid(),
                            TenantId = tenantId,
                            WorkspaceId = workspaceId,
                            ProjectId = projectId,
                            environment.Slug,
                            environment.DisplayName,
                            environment.SortOrder,
                            environment.IsActive,
                            CreatedUtc = createdUtc,
                            LastModifiedUtc = createdUtc,
                        },
                        transaction,
                        cancellationToken: cancellationToken))
                    .ConfigureAwait(false);
            }

            foreach (GovernanceEnvironmentTransition transition in catalog.Transitions)
            {
                await connection.ExecuteAsync(
                    new CommandDefinition(
                        insertTransitionSql,
                        new
                        {
                            TransitionId = Guid.NewGuid(),
                            TenantId = tenantId,
                            WorkspaceId = workspaceId,
                            ProjectId = projectId,
                            transition.SourceSlug,
                            transition.TargetSlug,
                        },
                        transaction,
                        cancellationToken: cancellationToken))
                    .ConfigureAwait(false);
            }

            await transaction.CommitAsync(cancellationToken).ConfigureAwait(false);
        }
        catch
        {
            await transaction.RollbackAsync(cancellationToken).ConfigureAwait(false);
            throw;
        }
    }
}
