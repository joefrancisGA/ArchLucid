using System.Net;

using ArchLucid.Core.Scoping;

using FluentAssertions;

namespace ArchLucid.Api.Tests.Security;

/// <summary>
///     Same-tenant workspace/project IDOR regression guard for high-value read/export routes.
/// </summary>
/// <remarks>
///     All six assertions share one <see cref="IdorSeedFixture" /> (one greenfield SQL catalog,
///     one warmup, one seeded run) so the class takes ~2 min instead of ~46 min on a normal CI
///     shard. CI #2235 shard 5/6 root causes were:
///     <list type="bullet">
///         <item>Each test created its own factory — six cold DbUp cycles + twelve architecture
///         request POSTs.</item>
///         <item><see cref="AuthorityPipelineWorkHostedService" /> (Combined role default) polled
///         <c>dbo.AuthorityPipelineWorkOutbox</c> every 2 s with UPDLOCK/ROWLOCK, racing the
///         create-run SQL and causing <c>Execution Timeout Expired</c> on the outbox CTE.
///         Fixed by <see cref="IdorGreenfieldSqlApiFactory" /> setting
///         <c>Hosting:Role=Api</c>.</item>
///     </list>
/// </remarks>
[Trait("Suite", "Core")]
[Trait("Category", "Slow")]
[Collection("ArchLucidEnvMutation")]
public sealed class WorkspaceProjectScopeIdorIntegrationTests(IdorSeedFixture seed)
    : IClassFixture<IdorSeedFixture>
{
    private const string SqlExplicitUnavailable =
        "Workspace/project IDOR tests: SQL integration env not configured.";

    private static readonly Guid AlternateWorkspace = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid AlternateProject = Guid.Parse("55555555-5555-5555-5555-555555555555");

    [SkippableFact]
    public async Task Wrong_workspace_cannot_read_run_detail_sql()
    {
        await AssertWrongWorkspaceRouteDeniedAsync(
            "authority run detail",
            static (client, runId) => client.GetAsync($"/v1/architecture/reviews/{runId}"));
    }

    [SkippableFact]
    public async Task Wrong_workspace_cannot_list_run_artifacts_sql()
    {
        await AssertWrongWorkspaceRouteDeniedAsync(
            "run artifact list",
            static (client, runId) => client.GetAsync($"/v1/architecture/reviews/{runId}/artifacts"));
    }

    [SkippableFact]
    public async Task Wrong_workspace_cannot_read_run_roi_estimate_sql()
    {
        await AssertWrongWorkspaceRouteDeniedAsync(
            "run ROI estimate",
            static (client, runId) => client.GetAsync($"/v1/architecture/review/{runId}/roi"));
    }

    [SkippableFact]
    public async Task Wrong_workspace_cannot_read_pilot_run_deltas_sql()
    {
        await AssertWrongWorkspaceRouteDeniedAsync(
            "pilot run deltas",
            static (client, runId) => client.GetAsync($"/v1/pilots/runs/{runId}/pilot-run-deltas"));
    }

    [SkippableFact]
    public async Task Wrong_workspace_cannot_read_explain_aggregate_sql()
    {
        await AssertWrongWorkspaceRouteDeniedAsync(
            "explain aggregate",
            static (client, runId) => client.GetAsync($"/v1/explain/runs/{runId}/aggregate"));
    }

    [SkippableFact]
    public async Task Wrong_workspace_cannot_download_run_export_zip_sql()
    {
        await AssertWrongWorkspaceRouteDeniedAsync(
            "artifact run export zip",
            static (client, runId) => client.GetAsync($"/v1/artifacts/reviews/{runId}/export"));
    }

    private async Task AssertWrongWorkspaceRouteDeniedAsync(
        string routeFamily,
        Func<HttpClient, string, Task<HttpResponseMessage>> send)
    {
        Skip.If(seed.ShardWarmupTimedOut, GreenfieldSqlIntegrationWarmup.ShardOverloadSkipReason);
        Skip.IfNot(seed.SqlReachable, SqlExplicitUnavailable);

        // Factory or seed run absent means InitializeAsync threw — fail fast with a clear message
        // rather than a NullReferenceException deep in the assertion.

        if (seed.Factory is null || seed.SeedRunId is null || seed.SeedRequestId is null)
            throw new InvalidOperationException(
                "IdorSeedFixture did not produce a seed run. "
                + "Check fixture initialization output for the setup exception.");

        using HttpClient wrongScopeClient = seed.Factory.CreateClient();
        WireScope(wrongScopeClient, ScopeIds.DefaultTenant, AlternateWorkspace, AlternateProject);

        using HttpResponseMessage response = await send(wrongScopeClient, seed.SeedRunId);

        response.StatusCode.Should().BeOneOf(
            [HttpStatusCode.NotFound, HttpStatusCode.Forbidden],
            because: $"{routeFamily} must not resolve for same-tenant wrong workspace/project scope.");

        string body = await response.Content.ReadAsStringAsync();
        body.Should().NotContain(seed.SeedRequestId, because: "wrong-scope denial must not leak request id.");
    }

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
