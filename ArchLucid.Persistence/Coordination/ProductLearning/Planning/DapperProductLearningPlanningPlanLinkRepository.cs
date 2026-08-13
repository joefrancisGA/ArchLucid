using System.Diagnostics.CodeAnalysis;

using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Contracts.ProductLearning.Planning;
using ArchLucid.Persistence.Connections;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Persistence.Coordination.ProductLearning.Planning;

[ExcludeFromCodeCoverage(Justification = "SQL-dependent repository; requires live SQL Server for integration testing.")]
internal sealed class DapperProductLearningPlanningPlanLinkRepository(ISqlConnectionFactory connectionFactory)
{
    public async Task AddPlanArchitectureRunLinkAsync(
        ProductLearningImprovementPlanRunLinkRecord link,
        CancellationToken cancellationToken)
    {
        ProductLearningPlanningRepositoryValidation.EnsureRunLink(link);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        ProductLearningScope scope = await RequirePlanScopeAsync(connection, link.PlanId, cancellationToken);

        await RequireArchitectureRunExistsAsync(connection, link.ArchitectureRunId, cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                ProductLearningPlanningPlanLinkSql.InsertArchitectureRunLink,
                new { link.PlanId, link.ArchitectureRunId, scope.TenantId, scope.WorkspaceId, scope.ProjectId },
                cancellationToken: cancellationToken));
    }

    public async Task AddPlanSignalLinkAsync(
        ProductLearningImprovementPlanSignalLinkRecord link,
        CancellationToken cancellationToken)
    {
        ProductLearningPlanningRepositoryValidation.EnsureSignalLink(link);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        ProductLearningScope scope = await RequirePlanScopeAsync(connection, link.PlanId, cancellationToken);

        await RequirePilotSignalInScopeAsync(connection, link.SignalId, scope, cancellationToken);

        await connection.ExecuteAsync(
            new CommandDefinition(
                ProductLearningPlanningPlanLinkSql.InsertSignalLink,
                new
                {
                    link.PlanId,
                    link.SignalId,
                    link.TriageStatusSnapshot,
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId
                },
                cancellationToken: cancellationToken));
    }

    public async Task AddPlanArtifactLinkAsync(
        ProductLearningImprovementPlanArtifactLinkRecord link,
        CancellationToken cancellationToken)
    {
        ProductLearningPlanningRepositoryValidation.EnsureArtifactLink(link);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);

        ProductLearningScope scope = await RequirePlanScopeAsync(connection, link.PlanId, cancellationToken);

        Guid linkId = link.LinkId == Guid.Empty ? Guid.NewGuid() : link.LinkId;

        if (link.AuthorityBundleId is not null && link.AuthorityArtifactSortOrder is not null)

            await RequireAuthorityArtifactInScopeAsync(
                connection,
                link.AuthorityBundleId.Value,
                link.AuthorityArtifactSortOrder.Value,
                scope,
                cancellationToken);


        await connection.ExecuteAsync(
            new CommandDefinition(
                ProductLearningPlanningPlanLinkSql.InsertArtifactLink,
                new
                {
                    LinkId = linkId,
                    link.PlanId,
                    link.AuthorityBundleId,
                    link.AuthorityArtifactSortOrder,
                    link.PilotArtifactHint,
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId
                },
                cancellationToken: cancellationToken));
    }

    public async Task<IReadOnlyList<string>> ListPlanArchitectureRunIdsAsync(
        Guid planId,
        ProductLearningScope scope,
        CancellationToken cancellationToken)
    {
        ProductLearningPlanningRepositoryValidation.EnsureScope(scope);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<string> ids = await connection.QueryAsync<string>(
            new CommandDefinition(
                ProductLearningPlanningPlanLinkSql.SelectPlanArchitectureRunIds,
                new { PlanId = planId, scope.TenantId, scope.WorkspaceId, scope.ProjectId },
                cancellationToken: cancellationToken));

        return ids.ToList();
    }

    public async Task<IReadOnlyList<ProductLearningImprovementPlanSignalLinkRecord>> ListPlanSignalLinksAsync(
        Guid planId,
        ProductLearningScope scope,
        CancellationToken cancellationToken)
    {
        ProductLearningPlanningRepositoryValidation.EnsureScope(scope);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<ProductLearningImprovementPlanSignalLinkSqlRow> rows =
            await connection.QueryAsync<ProductLearningImprovementPlanSignalLinkSqlRow>(
                new CommandDefinition(
                    ProductLearningPlanningPlanLinkSql.SelectPlanSignalLinks,
                    new { PlanId = planId, scope.TenantId, scope.WorkspaceId, scope.ProjectId },
                    cancellationToken: cancellationToken));

        return rows
            .Select(static r => new ProductLearningImprovementPlanSignalLinkRecord
            {
                PlanId = r.PlanId, SignalId = r.SignalId, TriageStatusSnapshot = r.TriageStatusSnapshot
            })
            .ToList();
    }

    public async Task<IReadOnlyList<ProductLearningImprovementPlanArtifactLinkRecord>> ListPlanArtifactLinksAsync(
        Guid planId,
        ProductLearningScope scope,
        CancellationToken cancellationToken)
    {
        ProductLearningPlanningRepositoryValidation.EnsureScope(scope);

        await using SqlConnection connection = await connectionFactory.CreateOpenConnectionAsync(cancellationToken);
        IEnumerable<ProductLearningImprovementPlanArtifactLinkSqlRow> rows =
            await connection.QueryAsync<ProductLearningImprovementPlanArtifactLinkSqlRow>(
                new CommandDefinition(
                    ProductLearningPlanningPlanLinkSql.SelectPlanArtifactLinks,
                    new { PlanId = planId, scope.TenantId, scope.WorkspaceId, scope.ProjectId },
                    cancellationToken: cancellationToken));

        return rows
            .Select(static r => new ProductLearningImprovementPlanArtifactLinkRecord
            {
                LinkId = r.LinkId,
                PlanId = r.PlanId,
                AuthorityBundleId = r.AuthorityBundleId,
                AuthorityArtifactSortOrder = r.AuthorityArtifactSortOrder,
                PilotArtifactHint = r.PilotArtifactHint
            })
            .ToList();
    }

    private static async Task<ProductLearningScope> RequirePlanScopeAsync(
        SqlConnection connection,
        Guid planId,
        CancellationToken cancellationToken)
    {
        ProductLearningScopeSqlRow? row = await connection.QuerySingleOrDefaultAsync<ProductLearningScopeSqlRow>(
            new CommandDefinition(
                ProductLearningPlanningPlanLinkSql.SelectPlanScope,
                new { PlanId = planId },
                cancellationToken: cancellationToken));

        if (row is null)
            throw new InvalidOperationException("Plan not found for PlanId=" + planId + ".");


        return new ProductLearningScope
        {
            TenantId = row.TenantId, WorkspaceId = row.WorkspaceId, ProjectId = row.ProjectId
        };
    }

    private static async Task RequireArchitectureRunExistsAsync(
        SqlConnection connection,
        string architectureRunId,
        CancellationToken cancellationToken)
    {
        if (!Guid.TryParseExact(architectureRunId, "N", out Guid runGuid))

            throw new InvalidOperationException(
                "ArchitectureRunId must be a 32-character hex run id (N format): " + architectureRunId);


        int ok = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                ProductLearningPlanningPlanLinkSql.ArchitectureRunExists,
                new { RunId = runGuid },
                cancellationToken: cancellationToken));

        if (ok == 0)
            throw new InvalidOperationException("dbo.Runs.RunId was not found: " + architectureRunId);
    }

    private static async Task RequirePilotSignalInScopeAsync(
        SqlConnection connection,
        Guid signalId,
        ProductLearningScope scope,
        CancellationToken cancellationToken)
    {
        int ok = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                ProductLearningPlanningPlanLinkSql.PilotSignalExistsInScope,
                new { SignalId = signalId, scope.TenantId, scope.WorkspaceId, scope.ProjectId },
                cancellationToken: cancellationToken));

        if (ok == 0)

            throw new InvalidOperationException(
                "ProductLearningPilotSignals row was not found in the plan's scope for SignalId=" + signalId + ".");
    }

    private static async Task RequireAuthorityArtifactInScopeAsync(
        SqlConnection connection,
        Guid bundleId,
        int sortOrder,
        ProductLearningScope scope,
        CancellationToken cancellationToken)
    {
        if (await connection.ExecuteScalarAsync<int>(
                new CommandDefinition(
                    ProductLearningPlanningPlanLinkSql.ArtifactBundleArtifactsTableExists,
                    cancellationToken: cancellationToken)) == 0)

            return;


        int ok = await connection.ExecuteScalarAsync<int>(
            new CommandDefinition(
                ProductLearningPlanningPlanLinkSql.AuthorityArtifactExistsInScope,
                new
                {
                    BundleId = bundleId,
                    SortOrder = sortOrder,
                    scope.TenantId,
                    scope.WorkspaceId,
                    scope.ProjectId
                },
                cancellationToken: cancellationToken));

        if (ok == 0)

            throw new InvalidOperationException(
                "Authority artifact coordinates were not found in the plan's scope (BundleId/SortOrder).");
    }
}
