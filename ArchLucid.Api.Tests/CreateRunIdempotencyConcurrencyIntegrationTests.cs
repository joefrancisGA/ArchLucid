using System.Net;
using System.Net.Http.Json;

using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Data.SqlClient;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Parallel POST <c>/v1/architecture/request</c> with the same <c>Idempotency-Key</c> must converge on a single
///     authority run (SQL storage).
/// </summary>
[Trait("Suite", "Core")]
[Trait("Category", "Integration")]
[Trait("Category", "Slow")]
[Collection("ArchLucidEnvMutation")]
public sealed class CreateRunIdempotencyConcurrencyIntegrationTests
{
    /// <summary>
    ///     Outer wall clock for the parallel idempotency test body (after greenfield bootstrap). Must exceed
    ///     <see cref="ParallelCreateRunBurstPhaseGuard" /> plus <see cref="ParallelCreateRunResolutionGuard" /> and stay
    ///     below slow-shard <c>--blame-hang-timeout</c> minus bootstrap.
    ///     4 parallel POSTs serialise through <c>sp_getapplock</c>, so the last waiter can need ~4 × pipeline duration
    ///     on cold CI SQL (~6–8 min each → ~28–32 min total). An 85-min buffer over the per-attempt HTTP ceiling
    ///     (total 100 min) survived a 70-min CI cancel on run 27023705522; stays below the 105-min blame-hang.
    /// </summary>
    private static readonly TimeSpan ParallelCreateRunHangGuard =
        ArchitectureRequestConcurrencyTestSupport.GreenfieldSqlArchitectureRequestBurstHttpTimeout
        + TimeSpan.FromMinutes(85);

    /// <summary>
    ///     Reserved for <see cref="ArchitectureRequestConcurrencyTestSupport.ResolveServiceUnavailablePerResponseAsync" />
    ///     after the parallel burst so a burst that consumes most of <see cref="ParallelCreateRunHangGuard" /> does not
    ///     cancel resolution with an already-fired token. Run 27246641656 exhausted a 20-min resolution budget while slot 0
    ///     was still replaying 503s (~40 min total); 40 min matches one full greenfield per-POST ceiling plus backoff.
    /// </summary>
    private static readonly TimeSpan ParallelCreateRunResolutionReserve = TimeSpan.FromMinutes(40);

    /// <summary>
    ///     Burst-phase budget only (parallel POST + transient 503 retries). Must stay within
    ///     <see cref="ParallelCreateRunHangGuard" /> minus <see cref="ParallelCreateRunResolutionReserve" />.
    /// </summary>
    private static readonly TimeSpan ParallelCreateRunBurstPhaseGuard =
        ParallelCreateRunHangGuard - ParallelCreateRunResolutionReserve;

    /// <summary>
    ///     Per-resolution-phase budget for replaying 503 slots after the burst. Uses the full
    ///     <see cref="ParallelCreateRunResolutionReserve" /> so resolution is not capped at 20 min while the outer hang
    ///     guard still has headroom.
    /// </summary>
    private static readonly TimeSpan ParallelCreateRunResolutionGuard = ParallelCreateRunResolutionReserve;

    private const string SqlUnavailable =
        "API greenfield SQL tests need SQL Server. Set "
        + TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable
        + " or "
        + TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable
        + " (see docs/BUILD.md), or use Windows with LocalDB.";

    private static bool IsSqlServerConfiguredForApiIntegration()
    {
        if (!string.IsNullOrWhiteSpace(
                Environment.GetEnvironmentVariable(TestDatabaseEnvironment.ApiIntegrationSqlEnvironmentVariable)))
            return true;

        return !string.IsNullOrWhiteSpace(
                   Environment.GetEnvironmentVariable(TestDatabaseEnvironment.PersistenceSqlEnvironmentVariable)) ||
               OperatingSystem.IsWindows();
    }

    [SkippableFact]
    public async Task Parallel_posts_with_same_idempotency_key_yield_single_run_id()
    {
        Skip.IfNot(IsSqlServerConfiguredForApiIntegration(), SqlUnavailable);

        await using GreenfieldSqlApiFactory factory = new();
        HttpClient client = factory.CreateClient();
        IntegrationTestBase.WireDefaultSqlIntegrationScopeHeaders(client);

        ArchitectureRequestConcurrencyTestSupport.AlignHttpClientTimeoutForSqlIdempotencyLockChain(
            client,
            ParallelCreateRunHangGuard);

        try
        {
            // Readiness + list-runs only: post-create-run warm competes with the parallel idempotency burst and can
            // exhaust GreenfieldSqlHostBootstrapBudget on cold CI SQL before the test hang guard starts.
            await GreenfieldSqlIntegrationWarmup.WarmArchitectureRequestHostOrSkipOnShardOverloadAsync(
                client,
                includePostCreateRunWarmup: false);
        }
        catch (WarmupTimedOutException)
        {
            Skip.If(true, GreenfieldSqlIntegrationWarmup.ShardOverloadSkipReason);
        }

        using CancellationTokenSource hangGuard = new();
        hangGuard.CancelAfter(ParallelCreateRunHangGuard);
        CancellationToken ct = hangGuard.Token;

        string idempotencyKey = "idem-conc-" + Guid.NewGuid().ToString("N");
        string requestId = "REQ-IDEM-" + Guid.NewGuid().ToString("N")[..12];
        object body = TestRequestFactory.CreateArchitectureRequest(requestId);

        const int parallel = 4;
        HttpResponseMessage[] responses;

        using (CancellationTokenSource burstPhaseGuard = CancellationTokenSource.CreateLinkedTokenSource(ct))
        {
            burstPhaseGuard.CancelAfter(ParallelCreateRunBurstPhaseGuard);

            responses =
                await ArchitectureRequestConcurrencyTestSupport.PostParallelArchitectureRequestWithTransientRetryAsync(
                    client,
                    body,
                    idempotencyKey,
                    parallel,
                    4,
                    500,
                    burstPhaseGuard.Token,
                    ParallelCreateRunBurstPhaseGuard);
        }

        using (CancellationTokenSource resolutionPhaseGuard = CancellationTokenSource.CreateLinkedTokenSource(ct))
        {
            resolutionPhaseGuard.CancelAfter(ParallelCreateRunResolutionGuard);

            responses = await ArchitectureRequestConcurrencyTestSupport.ResolveServiceUnavailablePerResponseAsync(
                client,
                body,
                idempotencyKey,
                responses,
                25,
                resolutionPhaseGuard.Token);
        }

        try
        {
            List<string> runIds = [];

            foreach (HttpResponseMessage response in responses)
            {
                response.StatusCode.Should().BeOneOf(HttpStatusCode.Created, HttpStatusCode.OK);

                CreateRunResponseDto? dto = await response.Content.ReadFromJsonAsync<CreateRunResponseDto>(
                    ArchitectureRequestConcurrencyTestSupport.JsonOptions);
                dto.Should().NotBeNull();
                dto.Run.RunId.Should().NotBeNullOrWhiteSpace();
                runIds.Add(dto.Run.RunId);
            }

            runIds.Distinct().Should().ContainSingle();
        }
        finally
        {
            ArchitectureRequestConcurrencyTestSupport.DisposeAll(responses);
        }

        await using SqlConnection connection = new(factory.SqlConnectionString);
        await connection.OpenAsync(ct);

        int authorityRunCount = await CountRunsWithRequestIdAsync(connection, requestId, ct);
        authorityRunCount.Should().Be(1);
    }

    private static async Task<int> CountRunsWithRequestIdAsync(SqlConnection connection, string requestId,
        CancellationToken ct)
    {
        const string sql = """
                           SELECT COUNT(1)
                           FROM dbo.Runs
                           WHERE ArchitectureRequestId = @RequestId;
                           """;

        await using SqlCommand cmd = new(sql, connection);
        _ = cmd.Parameters.AddWithValue("@RequestId", requestId);
        object? scalar = await cmd.ExecuteScalarAsync(ct);

        return Convert.ToInt32(scalar);
    }
}
