namespace ArchLucid.Api.Tests.Planning;

/// <summary>Exercises unknown-run responses through HTTP for two provisioned SQL tenant scopes.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class SecureNowSnapshotTwoTenantHttpTests(GreenfieldSqlApiFactory factory)
    : IClassFixture<GreenfieldSqlApiFactory>
{
    [SkippableTheory]
    [InlineData("aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", "aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa", "aaaaaaaa-3333-4333-8333-aaaaaaaaaaaa")]
    [InlineData("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", "bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb", "bbbbbbbb-4444-4444-8444-bbbbbbbbbbbb")]
    public async Task Unknown_graph_run_returns_run_not_found(string tenantId, string workspaceId, string projectId)
    {
        using HttpClient client = factory.CreateClient();
        GreenfieldIntegrationTenantScope.Scope scope = new(
            Guid.Parse(tenantId), Guid.Parse(workspaceId), Guid.Parse(projectId));
        await GreenfieldIntegrationTenantScope.EnsureScopeAsync(factory.SqlConnectionString, scope);
        GreenfieldIntegrationTenantScope.WireScope(client, scope);

        Guid runId = HarnessWellKnownGuids.UnknownRunForStoredEvidenceFiles;
        using HttpResponseMessage response = await client.GetAsync(
            $"/v1/evidence-graph/snapshot?runId={runId:D}&asOf=2026-11-22T09%3A00%3A00Z");
        await response.AssertRunNotFoundAsync();
    }
}
