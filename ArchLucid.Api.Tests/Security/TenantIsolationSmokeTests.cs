using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

using ArchLucid.Api.Controllers.Admin;
using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.Core.Scoping;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests.Security;

/// <summary>
///     Smoke test: with SQL storage, runs created under tenant A are invisible to API calls scoped as tenant B (headers
///     <c>x-tenant-id</c> / workspace / project). Isolation is enforced by the API and repository query scope, not database RLS.
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
public sealed class TenantIsolationSmokeTests
{
    /// <summary>
    ///     Backoff between transient POST retries plus slack so the outer CTS does not cancel mid-third-attempt when two
    ///     prior attempts each consumed a full <see cref="ArchitectureRequestConcurrencyTestSupport.ArchitectureRequestBurstHttpTimeout" />.
    /// </summary>
    private static readonly TimeSpan WarmCreateRunRetryHeadroom = TimeSpan.FromMinutes(10);

    /// <summary>
    ///     Outer wall clock for <see cref="PostArchitectureRequestWithTransientRetryAsync" />: three full create-run attempts
    ///     (each may run up to <see cref="ArchitectureRequestConcurrencyTestSupport.ArchitectureRequestBurstHttpTimeout" />)
    ///     plus <see cref="WarmCreateRunRetryHeadroom" />. Cold greenfield CI can burn two consecutive HttpClient timeouts
    ///     (idempotency wait + pipeline) before the third POST succeeds; a two-burst outer budget left only ~5m for that
    ///     third attempt and reproduced ~70m "retry budget exceeded" failures.
    /// </summary>
    private static readonly TimeSpan PostArchitectureTransientRetryOuterBudget =
        ArchitectureRequestConcurrencyTestSupport.ArchitectureRequestBurstHttpTimeout
        + ArchitectureRequestConcurrencyTestSupport.ArchitectureRequestBurstHttpTimeout
        + ArchitectureRequestConcurrencyTestSupport.ArchitectureRequestBurstHttpTimeout
        + WarmCreateRunRetryHeadroom;

    // Unlike idempotent-create SQL tests, this one requires *explicit* SQL (env var). Windows+localhost only is too easy
    // to misconfigure and caused long host-build hangs; CI sets the standard variables (see docs/BUILD.md).
    private const string SqlExplicitUnavailable =
        "Tenant isolation smoke: set "
        + TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable
        + " or "
        + TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable
        + " to a reachable instance, with a 4s connect probe to master (see "
        + nameof(Tenant_b_cannot_see_tenant_a_run_sql_rls) + " and docs/BUILD.md).";

    // Fixed alternate scope: distinct from <see cref="ScopeIds" /> defaults (tenant A in tests).
    private static readonly Guid TenantB = Guid.Parse("44444444-4444-4444-4444-444444444444");
    private static readonly Guid WorkspaceB = Guid.Parse("55555555-5555-5555-5555-555555555555");
    private static readonly Guid ProjectB = Guid.Parse("66666666-6666-6666-6666-666666666666");

    private static bool IsExplicitSqlServerEnvironmentConfigured()
    {
        if (!string.IsNullOrWhiteSpace(
                Environment.GetEnvironmentVariable(TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable)))
            return true;

        return !string.IsNullOrWhiteSpace(
            Environment.GetEnvironmentVariable(TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable));
    }

    /// <summary>Fast probe so we skip before <see cref="GreenfieldSqlApiFactory" /> when SQL is down (avoids long hangs).</summary>
    private static bool IsSqlServerReachableWithShortTimeout()
    {
        if (!IsExplicitSqlServerEnvironmentConfigured())
            return false;

        try
        {
            string connectionString =
                SqlServerIntegrationTestConnections.CreateEphemeralApiDatabaseConnectionString("master");
            SqlConnectionStringBuilder builder = new(connectionString)
            {
                ConnectTimeout = 4
            };
            using SqlConnection connection = new(builder.ConnectionString);
            connection.Open();
            return true;
        }
        catch
        {
            return false;
        }
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_see_tenant_a_run_sql_rls()
    {
        Skip.IfNot(IsSqlServerReachableWithShortTimeout(), SqlExplicitUnavailable);

        await using GreenfieldSqlApiFactory factory = new();
        using (HttpClient primer = factory.CreateClient())
        {
            IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(primer);
            await WarmSqlAuthorityPipelineAsync(primer);
        }

        await EnsureAlternateTenantAndWorkspaceAsync(factory.SqlConnectionString, TenantB, WorkspaceB, ProjectB);

        using HttpClient clientA = factory.CreateClient();
        WireScope(clientA, ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject);

        string requestId = "REQ-TNTISO-" + Guid.NewGuid().ToString("N")[..12];
        HttpResponseMessage create = await PostArchitectureRequestWithTransientRetryAsync(
            clientA,
            TestRequestFactory.CreateArchitectureRequest(requestId));
        await create.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created = await create.Content.ReadFromJsonAsync<CreateRunResponseDto>();
        string runId = created!.Run.RunId;

        using HttpClient clientB = factory.CreateClient();
        WireScope(clientB, TenantB, WorkspaceB, ProjectB);

        HttpResponseMessage getOther = await clientB.GetAsync($"/v1/architecture/run/{runId}");
        getOther.StatusCode.Should().Be(HttpStatusCode.NotFound, "Cross-tenant scope must hide other-tenant runs.");

        HttpResponseMessage listOther = await clientB.GetAsync("/v1/architecture/runs?limit=200");
        await listOther.EnsureSuccessForTestAsync();
        string listJson = await listOther.Content.ReadAsStringAsync();
        ListContainsRunId(listJson, runId).Should().BeFalse("list must not return runs from another tenant.");

        HttpResponseMessage getOwn = await clientA.GetAsync($"/v1/architecture/run/{runId}");
        await getOwn.EnsureSuccessForTestAsync();
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_access_tenant_a_run_roi_sql_rls()
    {
        Skip.IfNot(IsSqlServerReachableWithShortTimeout(), SqlExplicitUnavailable);

        await using GreenfieldSqlApiFactory factory = new();
        using (HttpClient primer = factory.CreateClient())
        {
            IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(primer);
            await WarmSqlAuthorityPipelineAsync(primer);
        }

        await EnsureAlternateTenantAndWorkspaceAsync(factory.SqlConnectionString, TenantB, WorkspaceB, ProjectB);

        using HttpClient clientA = factory.CreateClient();
        WireScope(clientA, ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject);

        string requestId = "REQ-TNTROI-" + Guid.NewGuid().ToString("N")[..12];
        HttpResponseMessage create = await PostArchitectureRequestWithTransientRetryAsync(
            clientA,
            TestRequestFactory.CreateArchitectureRequest(requestId));
        await create.EnsureSuccessForTestAsync();
        CreateRunResponseDto? created = await create.Content.ReadFromJsonAsync<CreateRunResponseDto>();
        string runId = created!.Run.RunId;

        using HttpClient clientB = factory.CreateClient();
        WireScope(clientB, TenantB, WorkspaceB, ProjectB);

        HttpResponseMessage roi = await clientB.GetAsync($"/v1/architecture/run/{runId}/roi");
        roi.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task Tenant_b_cannot_read_tenant_a_artifact_manifest_list_sql_rls()
    {
        Skip.IfNot(IsSqlServerReachableWithShortTimeout(), SqlExplicitUnavailable);

        await using GreenfieldSqlApiFactory factory = new();
        using (HttpClient primer = factory.CreateClient())
        {
            IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(primer);
            await WarmSqlAuthorityPipelineAsync(primer, includePostCreateRunWarmup: false);
        }

        await EnsureAlternateTenantAndWorkspaceAsync(factory.SqlConnectionString, TenantB, WorkspaceB, ProjectB);

        Guid? manifestId =
            await TryGetAnyGoldenManifestIdForTenantAsync(factory.SqlConnectionString, ScopeIds.DefaultTenant);

        Skip.If(!manifestId.HasValue, "Greenfield catalog has no GoldenManifest row for the default tenant yet.");

        using HttpClient clientB = factory.CreateClient();
        WireScope(clientB, TenantB, WorkspaceB, ProjectB);

        HttpResponseMessage art = await clientB.GetAsync($"/v1/artifacts/manifests/{manifestId:D}");
        art.StatusCode.Should().Be(HttpStatusCode.NotFound);
    }

    [SkippableFact]
    public async Task Admin_archive_batch_with_tenant_a_headers_does_not_archive_tenant_b_runs()
    {
        Skip.IfNot(IsSqlServerReachableWithShortTimeout(), SqlExplicitUnavailable);

        await using GreenfieldSqlApiFactory factory = new();
        // Full POST warmup: this test creates two runs (tenant A and B). Skipping warmup reproduced CI failures where
        // cold create-run + idempotency/SQL settled only after three 65-minute attempt budgets (~3h25m outer wall).
        using (HttpClient primer = factory.CreateClient())
        {
            IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(primer);
            await WarmSqlAuthorityPipelineAsync(primer);
        }

        await EnsureAlternateTenantAndWorkspaceAsync(factory.SqlConnectionString, TenantB, WorkspaceB, ProjectB);

        using HttpClient clientA = factory.CreateClient();
        WireScope(clientA, ScopeIds.DefaultTenant, ScopeIds.DefaultWorkspace, ScopeIds.DefaultProject);

        using HttpClient clientB = factory.CreateClient();
        WireScope(clientB, TenantB, WorkspaceB, ProjectB);

        string reqA = "REQ-ADMARCH-A-" + Guid.NewGuid().ToString("N")[..12];
        HttpResponseMessage createA = await PostArchitectureRequestWithTransientRetryAsync(
            clientA,
            TestRequestFactory.CreateArchitectureRequest(reqA));
        await createA.EnsureSuccessForTestAsync();
        CreateRunResponseDto? createdA = await createA.Content.ReadFromJsonAsync<CreateRunResponseDto>();
        string runIdA = createdA!.Run.RunId;

        string reqB = "REQ-ADMARCH-B-" + Guid.NewGuid().ToString("N")[..12];
        HttpResponseMessage createB = await PostArchitectureRequestWithTransientRetryAsync(
            clientB,
            TestRequestFactory.CreateArchitectureRequest(reqB));
        await createB.EnsureSuccessForTestAsync();
        CreateRunResponseDto? createdB = await createB.Content.ReadFromJsonAsync<CreateRunResponseDto>();
        string runIdB = createdB!.Run.RunId;

        HttpResponseMessage archive = await clientA.PostAsJsonAsync(
            "/v1/admin/runs/archive-batch",
            new AdminArchiveRunsBatchRequest { CreatedBeforeUtc = TimeProvider.System.GetUtcNow().AddYears(1) });

        await archive.EnsureSuccessForTestAsync();
        HttpResponseMessage getB = await clientB.GetAsync($"/v1/architecture/run/{runIdB}");
        await getB.EnsureSuccessForTestAsync();
        HttpResponseMessage getA = await clientA.GetAsync($"/v1/architecture/run/{runIdA}");
        getA.StatusCode.Should().Be(HttpStatusCode.NotFound, "tenant A admin batch should archive only tenant A runs.");
    }

    private static async Task<Guid?> TryGetAnyGoldenManifestIdForTenantAsync(string connectionString, Guid tenantId)
    {
        await using SqlConnection connection = new(connectionString);
        await connection.OpenAsync();

        await using SqlCommand cmd = connection.CreateCommand();
        cmd.CommandText =
            """
            SELECT TOP (1) ManifestId
            FROM dbo.GoldenManifests
            WHERE TenantId = @Tid AND ArchivedUtc IS NULL
            ORDER BY CreatedUtc DESC;
            """;
        cmd.Parameters.AddWithValue("@Tid", tenantId);
        object? scalar = await cmd.ExecuteScalarAsync();

        return scalar is Guid g ? g : null;
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

    private static bool ListContainsRunId(string json, string runId)
    {
        using JsonDocument doc = JsonDocument.Parse(json);
        foreach (JsonElement row in doc.RootElement.EnumerateArray())
        {
            if (row.TryGetProperty("runId", out JsonElement id) && string.Equals(
                    id.GetString(),
                    runId,
                    StringComparison.Ordinal))
                return true;
        }

        return false;
    }

    /// <summary>Inserts a second registry row so <c>CommercialTenantTierFilter</c> allows tenant Bâ€™s HTTP scope.</summary>
    private static async Task EnsureAlternateTenantAndWorkspaceAsync(
        string connectionString,
        Guid tenantId,
        Guid workspaceId,
        Guid defaultProjectId)
    {
        await using SqlConnection connection = new(connectionString);
        await connection.OpenAsync();

        await using SqlCommand cmd = connection.CreateCommand();
        cmd.CommandText =
            """
            IF NOT EXISTS (SELECT 1 FROM dbo.Tenants WHERE Id = @Tid)
                INSERT INTO dbo.Tenants (Id, Name, Slug, Tier, EntraTenantId)
                VALUES (@Tid, N'Tenant isolation B', N'tenant-iso-b', N'Standard', NULL);
            IF NOT EXISTS (SELECT 1 FROM dbo.TenantWorkspaces WHERE Id = @Wid)
                INSERT INTO dbo.TenantWorkspaces (Id, TenantId, Name, DefaultProjectId)
                VALUES (@Wid, @Tid, N'Workspace B', @Pid);
            IF OBJECT_ID(N'dbo.Projects', N'U') IS NOT NULL
               AND NOT EXISTS (SELECT 1 FROM dbo.Projects WHERE Id = @Pid)
                INSERT INTO dbo.Projects (Id, TenantId, WorkspaceId, Name, CreatedUtc, IsDeleted)
                VALUES (@Pid, @Tid, @Wid, N'default', SYSUTCDATETIME(), 0);
            """;
        cmd.Parameters.AddWithValue("@Tid", tenantId);
        cmd.Parameters.AddWithValue("@Wid", workspaceId);
        cmd.Parameters.AddWithValue("@Pid", defaultProjectId);
        _ = await cmd.ExecuteNonQueryAsync();
    }

    /// <summary>
    ///     DbUp + cold CI SQL can return 503 until migrations and first queries settle; combine readiness + list, and
    ///     optionally POST so the full authority write path is warmed before tests that create runs. Read-only tenant
    ///     checks can skip POST to avoid cold-path create runs that may exceed CI wall clocks or cancel mid-response.
    /// </summary>
    private static async Task WarmSqlAuthorityPipelineAsync(HttpClient client, bool includePostCreateRunWarmup = true)
    {
        ArchitectureRequestConcurrencyTestSupport.AlignHttpClientTimeoutForSqlIdempotencyLockChain(client);

        await WarmHealthReadyPathAsync(client);
        await WarmListRunsPathAsync(client);

        if (!includePostCreateRunWarmup)
            return;

        await WarmPostCreateRunPathAsync(client);
    }

    private static Task WarmHealthReadyPathAsync(HttpClient client) => HealthReadyProbe.EnsureReadyAsync(client);

    private static async Task WarmListRunsPathAsync(HttpClient client)
    {
        int delayMs = 1000;

        for (int attempt = 0; attempt < 60; attempt++)
        {
            using HttpResponseMessage response = await client.GetAsync("/v1/architecture/runs?limit=1");

            if (response.IsSuccessStatusCode)
                return;

            if (response.StatusCode != HttpStatusCode.ServiceUnavailable)
            {
                await response.EnsureSuccessForTestAsync();
                return;
            }

            await Task.Delay(delayMs);
            delayMs = Math.Min(delayMs * 2, 8000);
        }

        throw new InvalidOperationException(
            "GET /v1/architecture/runs stayed 503 (host still warming or SQL not reachable). "
            + "See " + nameof(WarmListRunsPathAsync) + " and greenfield host startup.");
    }

    /// <summary>
    ///     Primes the full create-run write path (authority pipeline, idempotency lock, persistence) so subsequent test
    ///     POSTs do not encounter cold-path timeouts on CI SQL. Uses the same transient-503 retry policy as test POSTs
    ///     so warmup does not give up while <see cref="PostArchitectureRequestWithTransientRetryAsync" /> would still retry.
    /// </summary>
    private static async Task WarmPostCreateRunPathAsync(HttpClient client)
    {
        using HttpResponseMessage response = await PostArchitectureRequestWithTransientRetryAsync(
            client,
            TestRequestFactory.CreateArchitectureRequest("REQ-WARMUP-" + Guid.NewGuid().ToString("N")[..8]));

        if (!response.IsSuccessStatusCode)
            throw new InvalidOperationException(
                "POST /v1/architecture/request warmup failed with HTTP "
                + (int)response.StatusCode
                + " (expected success after transient SQL retries). See "
                + nameof(WarmPostCreateRunPathAsync)
                + ", "
                + nameof(PostArchitectureRequestWithTransientRetryAsync)
                + ", and greenfield host startup.");
    }

    private static async Task<HttpResponseMessage> PostArchitectureRequestWithTransientRetryAsync(
        HttpClient client,
        object body)
    {
        string idempotencyKey = "tenant-iso-smoke-" + Guid.NewGuid().ToString("N");
        int delayMs = 250;

        // Outer budget: enough for multiple full POSTs; each attempt gets its own CancelAfter(BurstHttpTimeout) so one
        // long pipeline cannot consume the entire outer window and leave no time for a second try after 503s/timeouts.
        using CancellationTokenSource outerBudget = new(PostArchitectureTransientRetryOuterBudget);

        try
        {
            while (true)
            {
                outerBudget.Token.ThrowIfCancellationRequested();

                using CancellationTokenSource attemptBudget =
                    CancellationTokenSource.CreateLinkedTokenSource(outerBudget.Token);
                attemptBudget.CancelAfter(
                    ArchitectureRequestConcurrencyTestSupport.ArchitectureRequestBurstHttpTimeout);

                CancellationToken ct = attemptBudget.Token;

                try
                {
                    HttpResponseMessage response =
                        await ArchitectureRequestConcurrencyTestSupport.PostSingleArchitectureRequestAsync(
                            client,
                            body,
                            idempotencyKey,
                            ct);

                    if (response.StatusCode != HttpStatusCode.ServiceUnavailable)
                        return response;

                    response.Dispose();
                }
                catch (HttpRequestException ex) when (!outerBudget.IsCancellationRequested
                                                      && ArchitectureRequestConcurrencyTestSupport
                                                          .IndicatesClientAbortedResponseBuffering(ex))
                {
                    // TestServer long POSTs can drop the response stream without signaling our CTS; retry like a cold-start blip.
                }
                catch (TaskCanceledException ex) when (!outerBudget.IsCancellationRequested
                                                      && ex.InnerException is TimeoutException)
                {
                    // HttpClient.Timeout can surface here without linking to our operation token.
                }
                catch (TaskCanceledException) when (!outerBudget.IsCancellationRequested)
                {
                    // Per-attempt CTS (or HttpClient) canceled while outer budget remains — retry with backoff.
                }
                catch (OperationCanceledException) when (!outerBudget.IsCancellationRequested)
                {
                    // Same as TaskCanceled for completion-token paths without subclass.
                }

                await Task.Delay(delayMs, outerBudget.Token);
                delayMs = Math.Min(delayMs * 2, 4000);
            }
        }
        catch (OperationCanceledException) when (outerBudget.IsCancellationRequested)
        {
            throw new InvalidOperationException(
                "POST /v1/architecture/request exceeded retry budget (HTTP 503 or transient transport timeouts). See "
                + nameof(WarmSqlAuthorityPipelineAsync) + ", "
                + nameof(WarmListRunsPathAsync) + ", and "
                + nameof(PostArchitectureRequestWithTransientRetryAsync) + ".");
        }
    }
}
