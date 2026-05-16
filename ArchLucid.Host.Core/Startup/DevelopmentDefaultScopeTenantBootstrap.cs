using ArchLucid.Core.Scoping;

using Dapper;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Host.Core.Startup;

/// <summary>
/// Ensures <see cref="ScopeIds"/> default tenant (and workspace) rows exist in SQL so Development hosts pass
/// <c>CommercialTenantTierFilter</c> for the well-known integration scope.
/// </summary>
public static class DevelopmentDefaultScopeTenantBootstrap
{
    /// <summary>Idempotent inserts for empty greenfield / integration catalogs.</summary>
    public static void TryEnsure(string connectionString, ILogger logger)
    {
        if (string.IsNullOrWhiteSpace(connectionString))
            return;

        using SqlConnection connection = new(connectionString);
        connection.Open();

        int tenantsTableExists = connection.QuerySingle<int>(
            "SELECT CASE WHEN OBJECT_ID(N'dbo.Tenants', N'U') IS NULL THEN 0 ELSE 1 END;");

        if (tenantsTableExists == 0)
            return;

        int tenantCount = connection.QuerySingle<int>(
            "SELECT COUNT(1) FROM dbo.Tenants WHERE Id = @TenantId;",
            new { TenantId = ScopeIds.DefaultTenant, });

        if (tenantCount == 0)
        {
            _ = connection.Execute(
                """
                INSERT INTO dbo.Tenants (Id, Name, Slug, Tier, EntraTenantId)
                VALUES (@TenantId, @TenantName, @TenantSlug, N'Standard', NULL);
                """,
                new { TenantId = ScopeIds.DefaultTenant, TenantName = "Development default tenant", TenantSlug = "archlucid-dev-default-scope", });
        }

        int workspacesTableExists = connection.QuerySingle<int>(
            "SELECT CASE WHEN OBJECT_ID(N'dbo.TenantWorkspaces', N'U') IS NULL THEN 0 ELSE 1 END;");

        if (workspacesTableExists == 0)
            return;

        bool tenantWorkspacesSupportsDemoFlag =
            connection.QuerySingle<int>(
                @"SELECT CASE WHEN COL_LENGTH(N'dbo.TenantWorkspaces', N'IsDemoWorkspace') IS NULL THEN 0 ELSE 1 END;") != 0;

        int workspaceCount = connection.QuerySingle<int>(
            "SELECT COUNT(1) FROM dbo.TenantWorkspaces WHERE Id = @WorkspaceId;",
            new { WorkspaceId = ScopeIds.DefaultWorkspace, });

        if (workspaceCount == 0)
        {

            if (tenantWorkspacesSupportsDemoFlag)

                _ = connection.Execute(
                    """
                    INSERT INTO dbo.TenantWorkspaces (Id, TenantId, Name, DefaultProjectId, IsDemoWorkspace)
                    VALUES (@WorkspaceId, @TenantId, @WorkspaceName, @DefaultProjectId, 0);
                    """,
                    new
                    {
                        WorkspaceId = ScopeIds.DefaultWorkspace,
                        TenantId = ScopeIds.DefaultTenant,
                        WorkspaceName = "Development default workspace",
                        DefaultProjectId = ScopeIds.DefaultProject,
                    });

            else

                _ = connection.Execute(
                    """
                    INSERT INTO dbo.TenantWorkspaces (Id, TenantId, Name, DefaultProjectId)
                    VALUES (@WorkspaceId, @TenantId, @WorkspaceName, @DefaultProjectId);
                    """,
                    new
                    {
                        WorkspaceId = ScopeIds.DefaultWorkspace,
                        TenantId = ScopeIds.DefaultTenant,
                        WorkspaceName = "Development default workspace",
                        DefaultProjectId = ScopeIds.DefaultProject,
                    });
        }

        int projectsTableExists = connection.QuerySingle<int>(
            "SELECT CASE WHEN OBJECT_ID(N'dbo.Projects', N'U') IS NULL THEN 0 ELSE 1 END;");

        if (projectsTableExists != 0)
        {
            int projectRow = connection.QuerySingle<int>(
                "SELECT COUNT(1) FROM dbo.Projects WHERE Id = @ProjectId;",
                new { ProjectId = ScopeIds.DefaultProject, });

            if (projectRow == 0)
            {
                _ = connection.Execute(
                    """
                    INSERT INTO dbo.Projects (Id, TenantId, WorkspaceId, Name, CreatedUtc, IsDeleted)
                    VALUES (@ProjectId, @TenantId, @WorkspaceId, N'default', SYSUTCDATETIME(), 0);
                    """,
                    new
                    {
                        ProjectId = ScopeIds.DefaultProject,
                        TenantId = ScopeIds.DefaultTenant,
                        WorkspaceId = ScopeIds.DefaultWorkspace,
                    });
            }

            if (tenantWorkspacesSupportsDemoFlag)
            {
                Guid productTourWorkspaceId = DemoTourWorkspaceIds.WorkspaceRowId(ScopeIds.DefaultTenant);
                Guid productTourProjectId = DemoTourWorkspaceIds.ProjectScopeRowId(ScopeIds.DefaultTenant);
                int tourWorkspaceMissing =
                    connection.QuerySingle<int>(
                        "SELECT COUNT(1) FROM dbo.TenantWorkspaces WHERE Id = @TourWorkspaceId;",
                        new { TourWorkspaceId = productTourWorkspaceId, });

                if (tourWorkspaceMissing == 0)
                {

                    _ = connection.Execute(
                        """
                        INSERT INTO dbo.TenantWorkspaces (Id, TenantId, Name, DefaultProjectId, IsDemoWorkspace)
                        VALUES (@TourWorkspaceId, @TenantId, @TourWorkspaceName, @TourProjectId, 1);
                        """,
                        new
                        {
                            TourWorkspaceId = productTourWorkspaceId,
                            TenantId = ScopeIds.DefaultTenant,
                            TourWorkspaceName = "Product Tour — Architecture Review",
                            TourProjectId = productTourProjectId,
                        });

                    _ = connection.Execute(
                        """
                        INSERT INTO dbo.Projects (Id, TenantId, WorkspaceId, Name, CreatedUtc, IsDeleted)
                        VALUES (@TourProjectId, @TenantId, @TourWorkspaceId, @TourProjectSlug, SYSUTCDATETIME(), 0);
                        """,
                        new
                        {
                            TourProjectId = productTourProjectId,
                            TenantId = ScopeIds.DefaultTenant,
                            TourWorkspaceId = productTourWorkspaceId,
                            TourProjectSlug = "product-tour-architecture-context",
                        });
                }
            }
        }

        int verifyTenant = connection.QuerySingle<int>(
            "SELECT COUNT(1) FROM dbo.Tenants WHERE Id = @TenantId;",
            new { TenantId = ScopeIds.DefaultTenant, });

        if (verifyTenant != 1)
            throw new InvalidOperationException(
                "Development default tenant bootstrap failed: dbo.Tenants row for ScopeIds.DefaultTenant is missing after upsert.");

        if (logger.IsEnabled(LogLevel.Debug))
            logger.LogDebug("Development default scope tenant/workspace ensured.");
    }
}
