using ArchLucid.Core.Scoping;

namespace ArchLucid.Api.Tests.Security;

/// <summary>Primer + scoped tenant clients without duplicating greenfield warmup wiring in every security test.</summary>
public static class IntegrationTestTenantIsolationClients
{
    public static HttpClient CreatePrimerClient(ArchLucidApiFactory factory)
    {
        HttpClient client = factory.CreateClient();
        IntegrationTestSqlClientBootstrap.WireDefaultSqlIntegrationScopeHeaders(client);

        return client;
    }

    public static HttpClient CreateScopedClient(ArchLucidApiFactory factory, Guid tenantId, Guid workspaceId, Guid projectId)
    {
        HttpClient client = factory.CreateClient();
        WireScope(client, tenantId, workspaceId, projectId);

        return client;
    }

    public static HttpClient CreateDefaultScopeClient(ArchLucidApiFactory factory) =>
        CreateScopedClient(factory, ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject);

    public static void WireDefaultScope(HttpClient client) =>
        WireScope(client, ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject);

    private static void WireScope(HttpClient client, Guid tenantId, Guid workspaceId, Guid projectId)
    {
        client.DefaultRequestHeaders.Remove("x-tenant-id");
        client.DefaultRequestHeaders.Remove("x-workspace-id");
        client.DefaultRequestHeaders.Remove("x-project-id");
        _ = client.DefaultRequestHeaders.TryAddWithoutValidation("x-tenant-id", tenantId.ToString("D"));
        _ = client.DefaultRequestHeaders.TryAddWithoutValidation("x-workspace-id", workspaceId.ToString("D"));
        _ = client.DefaultRequestHeaders.TryAddWithoutValidation("x-project-id", projectId.ToString("D"));
    }
}
