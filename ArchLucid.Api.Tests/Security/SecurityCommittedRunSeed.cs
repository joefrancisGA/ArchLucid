using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Core.Scoping;

namespace ArchLucid.Api.Tests.Security;
/// <summary>
///     Shared committed-run seed for security integration tests. Uses <see cref="IdorGreenfieldSqlApiFactory" />
///     (<c>Hosting:Role=Api</c>) and full architecture-request warmup (including one create-run POST) before seeding.
/// </summary>
internal static class SecurityCommittedRunSeed
{
    internal sealed record Result(string RunId, Guid RunGuid);

    internal static async Task<Result> SeedDefaultScopeCommittedRunAsync(CancellationToken cancellationToken = default)
    {
        GreenfieldSqlIntegrationWarmup.SkipIfShardWarmupAlreadyTimedOut();

        await using IdorGreenfieldSqlApiFactory factory = new();

        using (HttpClient primer = factory.CreateClient())
        {
            IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(primer);
            await GreenfieldSqlIntegrationWarmup.WarmArchitectureRequestHostOrSkipOnShardOverloadAsync(
                primer,
                cancellationToken: cancellationToken).ConfigureAwait(false);
        }

        return await SeedCommittedRunOnWarmFactoryAsync(factory, cancellationToken).ConfigureAwait(false);
    }

    internal static async Task<Result> SeedCommittedRunOnWarmFactoryAsync(
        GreenfieldSqlApiFactory factory,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(factory);

        using HttpClient clientA = factory.CreateClient();
        WireScope(clientA, ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject);

        string requestId = "REQ-COMMIT-SEC-" + Guid.NewGuid().ToString("N")[..12];
        string idempotencyKey = "sec-committed-run-" + Guid.NewGuid().ToString("N");
        HttpResponseMessage create = await ArchitectureRequestConcurrencyTestSupport
            .PostSingleArchitectureRequestWithGreenfieldTransientRetryAsync(
                clientA,
                TestRequestFactory.CreateArchitectureRequest(requestId),
                idempotencyKey,
                cancellationToken).ConfigureAwait(false);

        await create.EnsureSuccessForTestAsync();

        CreateRunResponseDto? created = await create.Content.ReadFromJsonAsync<CreateRunResponseDto>(
            ArchitectureRequestConcurrencyTestSupport.JsonOptions,
            cancellationToken).ConfigureAwait(false);

        string runId = created!.Run.RunId;
        Guid runGuid = Guid.Parse(runId);

        await ArchitectureRequestConcurrencyTestSupport
            .PostExecuteAndCommitUnderGreenfieldBootstrapBudgetAsync(clientA, runId, cancellationToken);

        return new Result(runId, runGuid);
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
