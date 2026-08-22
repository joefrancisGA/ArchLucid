using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

using ArchLucid.Api.Tests.TestDtos;
using ArchLucid.TestSupport;

namespace ArchLucid.Api.Tests;

/// <summary>
///     Shared helpers for parallel <c>POST /v1/architecture/request</c> bursts (idempotency + transient 503 retry).
/// </summary>
internal static class ArchitectureRequestConcurrencyTestSupport
{
    /// <summary>
    ///     Default <see cref="HttpClient.Timeout" /> is 100s; create-run idempotency uses <c>sp_getapplock</c> with a
    ///     wait budget up to configured <c>ArchLucid:CreateRun:DistributedIdempotencyLockTimeoutMilliseconds</c>
    ///     (â‰¤1 hour clamp; greenfield SQL tests configure ~25 minutes so waiters survive a ~20-minute pipeline winner).
    ///     <see cref="PostSingleArchitectureRequestAsync" /> does not raise <see cref="HttpClient.Timeout" /> (callers align via
    ///     <see cref="AlignHttpClientTimeoutForSqlIdempotencyLockChain" /> before first HTTP when needed).
    ///     A single POST can wait on the lock and then run the authority pipeline (seconds for Simulator in practice; bounded by host
    ///     <c>AuthorityPipeline:PipelineTimeout</c>).
    ///     <see cref="ArchLucidApiFactory" /> sets <see cref="HttpClient.Timeout" /> around <strong>65</strong> minutes.
    ///     <see cref="GreenfieldSqlApiFactory" /> uses a tighter ceiling aligned to
    ///     <see cref="GreenfieldSqlArchitectureRequestBurstHttpTimeout" /> (applock wait + pipeline + SQL headroom).
    ///     Any per-operation CTS (e.g. transient 503 retry loops in integration tests) must meet or exceed that ceiling
    ///     plus backoff headroom — never below the factory HTTP timeout or a hung first attempt cancels before the pipeline
    ///     finishes despite the longer <see cref="HttpClient.Timeout" />.
    /// </summary>
    internal static readonly TimeSpan ArchitectureRequestBurstHttpTimeout = TimeSpan.FromMinutes(65);

    /// <summary>
    ///     Per-POST ceiling for <see cref="GreenfieldSqlApiFactory" /> (3 min <c>sp_getapplock</c> + 5 min pipeline +
    ///     parallel waiter headroom). Must stay below InMemory-factory hour-scale budgets and below slow-shard blame-hang.
    /// </summary>
    internal static readonly TimeSpan GreenfieldSqlArchitectureRequestBurstHttpTimeout = TimeSpan.FromMinutes(15);

    /// <summary>
    ///     Commit should succeed or return 409/503 quickly; 15-minute per-attempt budgets let thread-pool-starved shards
    ///     burn CI time when POST hangs (CI #2374).
    /// </summary>
    internal static readonly TimeSpan GreenfieldSqlCommitAttemptHttpTimeout = TimeSpan.FromSeconds(90);

    /// <summary>
    ///     Total wall-clock budget for the commit retry loop (CI #2377: 25 Ã— 90s attempts consumed ~39 min on TB-294/295).
    /// </summary>
    internal static readonly TimeSpan GreenfieldSqlCommitRetryWallClockBudget = TimeSpan.FromMinutes(8);

    /// <summary>
    ///     Per-cycle cap for manifest readiness polls inside the commit retry loop.
    /// </summary>
    internal static readonly TimeSpan GreenfieldSqlManifestPollBudget = TimeSpan.FromSeconds(60);

    /// <summary>
    ///     DbUp + readiness + optional first create-run on an empty catalog (outside parallel-burst hang guards).
    ///     Must cover <see cref="WarmListRunsPathAsync" /> worst-case warmup (~8 min at max backoff) plus at least two full
    ///     <see cref="GreenfieldSqlArchitectureRequestBurstHttpTimeout" /> cycles, so a first attempt that times out on a slow
    ///     CI shard can be retried before the outer bootstrap token fires.
    ///     2 Ã— 15 min + 8 min list-runs overhead + 2 min headroom = 40 min minimum; 50 min gives one extra 15-min retry slot
    ///     for unusually loaded shards.
    /// </summary>
    internal static readonly TimeSpan GreenfieldSqlHostBootstrapBudget = TimeSpan.FromMinutes(50);

    internal static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web)
    {
        PropertyNameCaseInsensitive = true,
        Converters = { new JsonStringEnumConverter(null) }
    };

    internal static StringContent JsonContent(object value)
    {
        string json = JsonSerializer.Serialize(value, JsonOptions);
        return new StringContent(json, Encoding.UTF8, "application/json");
    }

    internal static async Task<HttpResponseMessage[]> PostParallelArchitectureRequestAsync(
        HttpClient client,
        object body,
        string idempotencyKey,
        int parallel,
        CancellationToken cancellationToken = default,
        TimeSpan? parallelOperationTimeout = null)
    {
        TimeSpan burstTimeout = parallelOperationTimeout ?? ArchitectureRequestBurstHttpTimeout;

        if (parallel > 1)
            AlignHttpClientTimeoutForSqlIdempotencyLockChain(client, burstTimeout);

        // Per-operation timeout: cannot assign HttpClient.Timeout after the first request (runtime throws). Cold CI
        // SQL + DbUp + serialized sp_getapplock chains can exceed many minutes (N slots x create-run duration).
        TimeSpan operationTimeout = parallel > 1 ? burstTimeout : TimeSpan.FromSeconds(100);

        using CancellationTokenSource timeoutCts = new();
        timeoutCts.CancelAfter(operationTimeout);

        using CancellationTokenSource linked = CancellationTokenSource.CreateLinkedTokenSource(
            cancellationToken, timeoutCts.Token);
        CancellationToken ct = linked.Token;

        Task<HttpResponseMessage>[] tasks = new Task<HttpResponseMessage>[parallel];

        for (int i = 0; i < parallel; i++)
        {
            tasks[i] = PostArchitectureRequestAndBufferAsync(client, body, idempotencyKey, ct);
        }

        return await Task.WhenAll(tasks);
    }

    internal static Task<HttpResponseMessage> PostSingleArchitectureRequestAsync(
        HttpClient client,
        object body,
        string idempotencyKey,
        CancellationToken cancellationToken)
    {
        return PostArchitectureRequestAndBufferAsync(client, body, idempotencyKey, cancellationToken);
    }

    /// <summary>
    ///     Uses <see cref="HttpCompletionOption.ResponseHeadersRead" /> then buffers the body under
    ///     <paramref name="cancellationToken" />, which is more reliable for long-running create-run + idempotency waits
    ///     against <see cref="Microsoft.AspNetCore.TestHost.TestServer" /> than default response buffering alone.
    /// </summary>
    private static async Task<HttpResponseMessage> PostArchitectureRequestAndBufferAsync(
        HttpClient client,
        object body,
        string idempotencyKey,
        CancellationToken cancellationToken)
    {
        using HttpRequestMessage request = new(HttpMethod.Post, "/v1/architecture/request");
        request.Content = JsonContent(body);

        request.Headers.TryAddWithoutValidation("Idempotency-Key", idempotencyKey);

        HttpResponseMessage response =
            await client.SendAsync(request, HttpCompletionOption.ResponseHeadersRead, cancellationToken);

        try
        {
            await response.Content.LoadIntoBufferAsync(cancellationToken);
            return response;
        }
        catch (Exception ex) when (ShouldTreatAsCanceledResponseBuffering(ex, cancellationToken))
        {
            response.Dispose();
            throw new OperationCanceledException(
                "Response buffering was aborted after the request cancellation token fired.",
                ex,
                cancellationToken);
        }
    }

    private static bool ShouldTreatAsCanceledResponseBuffering(Exception ex, CancellationToken cancellationToken)
    {
        return cancellationToken.IsCancellationRequested && HasClientAbortedIoException(ex);
    }

    /// <summary>
    ///     True when <paramref name="ex" /> matches TestHost/Sockets abort during response buffering (see
    ///     <see cref="PostArchitectureRequestAndBufferAsync" />).
    /// </summary>
    internal static bool IndicatesClientAbortedResponseBuffering(Exception ex) => HasClientAbortedIoException(ex);

    private static bool HasClientAbortedIoException(Exception ex)
    {
        Exception? current = ex;

        while (current is not null)
        {
            if (current is IOException ioException
                && string.Equals(ioException.Message, "The client aborted the request.", StringComparison.Ordinal))
                return true;

            current = current.InnerException;
        }

        return false;
    }

    /// <summary>
    ///     Replays any <see cref="HttpStatusCode.ServiceUnavailable" /> slots with single POSTs (same idempotency key) until
    ///     success or max attempts.
    /// </summary>
    internal static async Task<HttpResponseMessage[]> ResolveServiceUnavailablePerResponseAsync(
        HttpClient client,
        object body,
        string idempotencyKey,
        HttpResponseMessage[] responses,
        int maxPerSlotAttempts,
        CancellationToken cancellationToken)
    {
        for (int i = 0; i < responses.Length; i++)
        {
            int delayMs = 250;

            for (int attempt = 0;
                 attempt < maxPerSlotAttempts && responses[i].StatusCode == HttpStatusCode.ServiceUnavailable;
                 attempt++)
            {
                cancellationToken.ThrowIfCancellationRequested();

                responses[i].Dispose();
                await Task.Delay(delayMs, cancellationToken);
                delayMs = Math.Min(delayMs * 2, 4000);

                using CancellationTokenSource attemptBudget =
                    CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
                attemptBudget.CancelAfter(GreenfieldSqlArchitectureRequestBurstHttpTimeout);

                try
                {
                    responses[i] =
                        await PostSingleArchitectureRequestAsync(client, body, idempotencyKey, attemptBudget.Token);
                }
                catch (OperationCanceledException ex) when (cancellationToken.IsCancellationRequested)
                {
                    throw new OperationCanceledException(
                        "ResolveServiceUnavailablePerResponseAsync aborted: outer cancellation token fired "
                        + "(hang guard or test CancellationToken expired) while retrying slot "
                        + i
                        + ", attempt "
                        + (attempt + 1)
                        + ".",
                        ex,
                        cancellationToken);
                }
            }
        }

        return responses;
    }

    /// <summary>
    ///     Under parallel POST, SQL can briefly return errors mapped to HTTP 503; retry the whole burst with backoff.
    /// </summary>
    internal static async Task<HttpResponseMessage[]> PostParallelArchitectureRequestWithTransientRetryAsync(
        HttpClient client,
        object body,
        string idempotencyKey,
        int parallel,
        int maxAttempts,
        int initialDelayMilliseconds,
        CancellationToken cancellationToken,
        TimeSpan? parallelOperationTimeout = null)
    {
        TimeSpan burstTimeout = parallelOperationTimeout ?? ArchitectureRequestBurstHttpTimeout;
        AlignHttpClientTimeoutForSqlIdempotencyLockChain(client, burstTimeout);

        int delayMilliseconds = initialDelayMilliseconds;
        HttpResponseMessage[] responses =
            await PostParallelArchitectureRequestAsync(client, body, idempotencyKey, parallel, cancellationToken,
                burstTimeout);

        for (int attempt = 0;
             attempt < maxAttempts - 1 && responses.Any(static r => r.StatusCode == HttpStatusCode.ServiceUnavailable);
             attempt++)
        {
            DisposeAll(responses);
            await Task.Delay(delayMilliseconds, cancellationToken);
            delayMilliseconds = Math.Min(delayMilliseconds * 2, 4000);
            responses = await PostParallelArchitectureRequestAsync(client, body, idempotencyKey, parallel,
                cancellationToken, burstTimeout);
        }

        return responses;
    }

    /// <summary>
    ///     Runs DbUp/readiness and a single create-run POST before parallel idempotency bursts so migrations and cold SQL
    ///     do not compete with <c>sp_getapplock</c> waiters inside the test hang guard.
    /// </summary>
    internal static async Task WarmGreenfieldSqlHostForArchitectureRequestTestsAsync(
        HttpClient client,
        CancellationToken cancellationToken = default,
        bool includePostCreateRunWarmup = true)
    {
        await RunUnderGreenfieldHostBootstrapBudgetAsync(
            cancellationToken,
            nameof(WarmGreenfieldSqlHostForArchitectureRequestTestsAsync),
            async ct =>
            {
                AlignHttpClientTimeoutForSqlIdempotencyLockChain(client, GreenfieldSqlArchitectureRequestBurstHttpTimeout);
                await HealthReadyProbe.EnsureReadyAsync(client, ct);
                await WarmListRunsPathAsync(client, ct);

                if (!includePostCreateRunWarmup)
                    return;

                await WarmSingleCreateRunPathAsync(client, ct);
            });
    }

    /// <summary>
    ///     Readiness + list-runs + one create-run (proven warmup path) + execute for greenfield SQL integration seeds.
    /// </summary>
    internal static async Task<string> WarmGreenfieldSqlHostAndSeedExecutedRunAsync(
        HttpClient client,
        CancellationToken cancellationToken = default)
    {
        string runId = string.Empty;

        await RunUnderGreenfieldHostBootstrapBudgetAsync(
            cancellationToken,
            nameof(WarmGreenfieldSqlHostAndSeedExecutedRunAsync),
            async ct =>
            {
                AlignHttpClientTimeoutForSqlIdempotencyLockChain(client, GreenfieldSqlArchitectureRequestBurstHttpTimeout);
                await HealthReadyProbe.EnsureReadyAsync(client, ct);
                await WarmListRunsPathAsync(client, ct);

                runId = await WarmSingleCreateRunPathReturningRunIdAsync(client, ct);
                await PostExecuteWithGreenfieldTransientRetryAsync(client, runId, ct);
            });

        return runId;
    }

    /// <summary>
    ///     Bounds greenfield SQL factory startup (DbUp + readiness) for <see cref="GreenfieldSqlApiFactory" /> and seeds.
    /// </summary>
    internal static Task RunGreenfieldSqlFactoryBootstrapAsync(
        Func<CancellationToken, Task> bootstrapBody,
        CancellationToken cancellationToken = default)
    {
        return RunUnderGreenfieldHostBootstrapBudgetAsync(
            cancellationToken,
            nameof(GreenfieldSqlApiFactory),
            bootstrapBody);
    }

    private static async Task RunUnderGreenfieldHostBootstrapBudgetAsync(
        CancellationToken cancellationToken,
        string entryPointName,
        Func<CancellationToken, Task> warmupBody)
    {
        Console.Error.WriteLine(
            "[GreenfieldSqlWarmup] "
            + entryPointName
            + " starting at "
            + DateTime.UtcNow.ToString("O")
            + "; budget="
            + GreenfieldSqlHostBootstrapBudget);

        using CancellationTokenSource bootstrap = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        bootstrap.CancelAfter(GreenfieldSqlHostBootstrapBudget);
        CancellationToken ct = bootstrap.Token;

        try
        {
            await warmupBody(ct);
        }
        catch (OperationCanceledException ex) when (bootstrap.Token.IsCancellationRequested)
        {
            throw CreateWarmupTimedOutException(ex, entryPointName);
        }
    }

    private static WarmupTimedOutException CreateWarmupTimedOutException(
        OperationCanceledException ex,
        string entryPointName)
    {
        return new WarmupTimedOutException(
            "Greenfield SQL host warmup exceeded "
            + nameof(GreenfieldSqlHostBootstrapBudget)
            + " ("
            + GreenfieldSqlHostBootstrapBudget
            + "). See "
            + entryPointName
            + " and "
            + nameof(WarmSingleCreateRunPathAsync)
            + ".",
            ex);
    }

    /// <summary>
    ///     Single POST with greenfield SQL per-attempt budgets (not InMemory-factory 65m bursts). Callers on
    ///     <see cref="GreenfieldSqlApiFactory" /> should warm via
    ///     <see cref="WarmGreenfieldSqlHostForArchitectureRequestTestsAsync" /> first when cold-start 503s are likely.
    /// </summary>
    internal static async Task<HttpResponseMessage> PostSingleArchitectureRequestWithGreenfieldTransientRetryAsync(
        HttpClient client,
        object body,
        string? idempotencyKey = null,
        CancellationToken cancellationToken = default,
        int maxAttempts = 10)
    {
        AlignHttpClientTimeoutForSqlIdempotencyLockChain(client, GreenfieldSqlArchitectureRequestBurstHttpTimeout);

        string key = idempotencyKey ?? "greenfield-post-" + Guid.NewGuid().ToString("N");
        int delayMs = 250;

        for (int attempt = 0; attempt < maxAttempts; attempt++)
        {
            using CancellationTokenSource attemptBudget =
                CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            attemptBudget.CancelAfter(GreenfieldSqlArchitectureRequestBurstHttpTimeout);

            try
            {
                HttpResponseMessage response = await PostSingleArchitectureRequestAsync(
                    client,
                    body,
                    key,
                    attemptBudget.Token);

                if (response.StatusCode != HttpStatusCode.ServiceUnavailable)
                    return response;

                response.Dispose();
            }
            catch (HttpRequestException ex) when (!cancellationToken.IsCancellationRequested
                                                  && IndicatesClientAbortedResponseBuffering(ex))
            {
            }
            catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested
                                                   && ex.InnerException is TimeoutException)
            {
            }
            catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
            }

            await Task.Delay(delayMs, cancellationToken);
            delayMs = Math.Min(delayMs * 2, 4000);
        }

        throw new InvalidOperationException(
            "POST /v1/architecture/request did not succeed after "
            + maxAttempts
            + " greenfield transient retries. See "
            + nameof(PostSingleArchitectureRequestWithGreenfieldTransientRetryAsync)
            + " and "
            + nameof(WarmGreenfieldSqlHostForArchitectureRequestTestsAsync)
            + ".");
    }

    private static async Task WarmListRunsPathAsync(HttpClient client, CancellationToken cancellationToken)
    {
        int delayMs = 1000;

        for (int attempt = 0; attempt < 60; attempt++)
        {
            using HttpResponseMessage response = await client.GetAsync("/v1/architecture/runs?limit=1", cancellationToken);

            if (response.IsSuccessStatusCode)
                return;

            if (response.StatusCode != HttpStatusCode.ServiceUnavailable)
            {
                response.EnsureSuccessStatusCode();
                return;
            }

            await Task.Delay(delayMs, cancellationToken);
            delayMs = Math.Min(delayMs * 2, 8000);
        }

        throw new InvalidOperationException(
            "GET /v1/architecture/runs stayed 503 while warming the greenfield SQL host. See "
            + nameof(WarmGreenfieldSqlHostForArchitectureRequestTestsAsync)
            + ".");
    }

    private static async Task WarmSingleCreateRunPathAsync(HttpClient client, CancellationToken cancellationToken)
    {
        _ = await WarmSingleCreateRunPathReturningRunIdAsync(client, cancellationToken);
    }

    private static async Task<string> WarmSingleCreateRunPathReturningRunIdAsync(
        HttpClient client,
        CancellationToken cancellationToken)
    {
        object body = TestRequestFactory.CreateArchitectureRequest(
            "REQ-GREENFIELD-WARM-" + Guid.NewGuid().ToString("N")[..8]);
        string idempotencyKey = "greenfield-warm-" + Guid.NewGuid().ToString("N");

        using HttpResponseMessage response = await PostSingleArchitectureRequestWithGreenfieldTransientRetryAsync(
            client,
            body,
            idempotencyKey,
            cancellationToken,
            maxAttempts: 20);

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException(
                "POST /v1/architecture/request warmup failed with HTTP "
                + (int)response.StatusCode
                + " (expected success after transient SQL retries). See "
                + nameof(WarmGreenfieldSqlHostForArchitectureRequestTestsAsync)
                + ".");
        }

        CreateRunResponseDto? created = await response.Content.ReadFromJsonAsync<CreateRunResponseDto>(JsonOptions, cancellationToken);

        return created!.Run.RunId;
    }

    internal static async Task PostExecuteWithGreenfieldTransientRetryAsync(
        HttpClient client,
        string runId,
        CancellationToken cancellationToken = default,
        int maxAttempts = 10)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        AlignHttpClientTimeoutForSqlIdempotencyLockChain(client, GreenfieldSqlArchitectureRequestBurstHttpTimeout);

        int delayMs = 250;

        for (int attempt = 0; attempt < maxAttempts; attempt++)
        {
            using CancellationTokenSource attemptBudget =
                CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            attemptBudget.CancelAfter(GreenfieldSqlArchitectureRequestBurstHttpTimeout);

            try
            {
                using HttpResponseMessage response = await client.PostAsync(
                    $"/v1/architecture/review/{runId}/execute",
                    null,
                    attemptBudget.Token);

                if (response.IsSuccessStatusCode)
                    return;

                if (await response.IsAuthorityPipelineCompleteExecuteConflictAsync(attemptBudget.Token))
                    return;

                if (response.StatusCode != HttpStatusCode.ServiceUnavailable)
                    await response.EnsureSuccessForTestAsync();
            }
            catch (HttpRequestException ex) when (!cancellationToken.IsCancellationRequested
                                                  && IndicatesClientAbortedResponseBuffering(ex))
            {
            }
            catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested
                                                   && ex.InnerException is TimeoutException)
            {
            }
            catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
            }

            await Task.Delay(delayMs, cancellationToken);
            delayMs = Math.Min(delayMs * 2, 4000);
        }

        throw new InvalidOperationException(
            "POST /v1/architecture/review/{runId}/execute did not succeed after "
            + maxAttempts
            + " greenfield transient retries.");
    }

    /// <summary>
    ///     Execute then commit under <see cref="GreenfieldSqlHostBootstrapBudget" /> (TB-294/TB-295 slow-shard seeds).
    /// </summary>
    internal static Task PostExecuteAndCommitUnderGreenfieldBootstrapBudgetAsync(
        HttpClient client,
        string runId,
        CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        return RunGreenfieldSqlFactoryBootstrapAsync(
            async ct =>
            {
                await PostExecuteWithGreenfieldTransientRetryAsync(client, runId, ct);
                await PostCommitWithGreenfieldTransientRetryAsync(client, runId, ct);
            },
            cancellationToken);
    }

    /// <summary>
    ///     Commit can return <c>409 Conflict</c> when manifest materialization races under CI SQL load; retry with backoff
    ///     like execute/create-run helpers (TB-290/TB-291/TB-295 commit flakes on integration shards).
    /// </summary>
    internal static async Task PostCommitWithGreenfieldTransientRetryAsync(
        HttpClient client,
        string runId,
        CancellationToken cancellationToken = default,
        int maxAttempts = 25)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(runId);

        AlignHttpClientTimeoutForSqlIdempotencyLockChain(client, GreenfieldSqlArchitectureRequestBurstHttpTimeout);

        await WaitUntilRunManifestReadableForCommitWithPollBudgetAsync(client, runId, cancellationToken);

        System.Diagnostics.Stopwatch totalWallClock = System.Diagnostics.Stopwatch.StartNew();
        int delayMs = 250;
        HttpStatusCode? lastStatusCode = null;
        string? lastBody = null;
        int consecutiveManifestNotLoaded409 = 0;

        for (int attempt = 0; attempt < maxAttempts; attempt++)
        {
            if (totalWallClock.Elapsed >= GreenfieldSqlCommitRetryWallClockBudget)
            {
                throw new GreenfieldCommitRetryBudgetExhaustedException(
                    "POST /v1/architecture/review/"
                    + runId
                    + "/commit retry budget exhausted after "
                    + totalWallClock.Elapsed.TotalMinutes.ToString("N1", System.Globalization.CultureInfo.InvariantCulture)
                    + " min (wall clock). Last status="
                    + (lastStatusCode is null ? "none" : ((int)lastStatusCode).ToString(System.Globalization.CultureInfo.InvariantCulture))
                    + ". Body="
                    + (lastBody ?? "(none)"));
            }

            if (await GreenfieldCommittedRunReadinessPoll.TryReturnIfRunAlreadyCommittedAsync(client, runId, cancellationToken))
                return;

            using CancellationTokenSource attemptBudget =
                CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            attemptBudget.CancelAfter(GreenfieldSqlCommitAttemptHttpTimeout);

            try
            {
                using HttpResponseMessage response = await client.PostAsync(
                    $"/v1/architecture/review/{runId}/finalize",
                    null,
                    attemptBudget.Token);

                if (response.IsSuccessStatusCode)
                {
                    await GreenfieldCommittedRunReadinessPoll.WaitUntilCommittedRunDetailReadableAsync(
                        client,
                        runId,
                        cancellationToken);

                    return;
                }

                lastStatusCode = response.StatusCode;
                lastBody = await response.Content.ReadAsStringAsync(attemptBudget.Token);

                if (response.StatusCode is not (HttpStatusCode.Conflict or HttpStatusCode.ServiceUnavailable))
                {
                    throw new Xunit.Sdk.XunitException(
                        $"POST /v1/architecture/review/{runId}/finalize failed after {attempt + 1} attempt(s). "
                        + $"Status={(int)response.StatusCode}. Body={lastBody}");
                }

                if (GreenfieldCommittedRunReadinessPoll.IsManifestNotLoadedYetConflict(response.StatusCode, lastBody))
                {
                    consecutiveManifestNotLoaded409++;

                    if (consecutiveManifestNotLoaded409 >= 3)
                    {
                        string diagnostic =
                            await GreenfieldCommittedRunReadinessPoll.FormatRunDetailDiagnosticAsync(
                                client,
                                runId,
                                cancellationToken);

                        throw new GreenfieldCommitRetryBudgetExhaustedException(
                            "POST /v1/architecture/review/"
                            + runId
                            + "/commit returned persistent manifest-not-loaded 409 after "
                            + consecutiveManifestNotLoaded409.ToString(System.Globalization.CultureInfo.InvariantCulture)
                            + " consecutive attempts. Body="
                            + lastBody
                            + ". Run detail diagnostic: "
                            + diagnostic);
                    }

                    await WaitUntilRunManifestReadableForCommitWithPollBudgetAsync(client, runId, cancellationToken);
                }
                else
                {
                    consecutiveManifestNotLoaded409 = 0;
                }
            }
            catch (HttpRequestException ex) when (!cancellationToken.IsCancellationRequested
                                                  && IndicatesClientAbortedResponseBuffering(ex))
            {
            }
            catch (TaskCanceledException ex) when (!cancellationToken.IsCancellationRequested
                                                   && ex.InnerException is TimeoutException)
            {
            }
            catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
            }
            catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
            {
            }

            await Task.Delay(delayMs, cancellationToken);
            delayMs = Math.Min(delayMs * 2, 8000);
        }

        throw new GreenfieldCommitRetryBudgetExhaustedException(
            "POST /v1/architecture/review/{runId}/finalize did not succeed after "
            + maxAttempts
            + " greenfield transient retries."
            + (lastStatusCode is null
                ? string.Empty
                : $" Last status={(int)lastStatusCode} ({lastStatusCode}). Body={lastBody}"));
    }

    private static Task WaitUntilRunManifestReadableForCommitWithPollBudgetAsync(
        HttpClient client,
        string runId,
        CancellationToken cancellationToken)
    {
        using CancellationTokenSource pollBudget =
            CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);

        pollBudget.CancelAfter(GreenfieldSqlManifestPollBudget);

        return GreenfieldCommittedRunReadinessPoll.WaitUntilRunManifestReadableForCommitAsync(
            client,
            runId,
            pollBudget.Token);
    }

    internal static void DisposeAll(HttpResponseMessage[] responses)
    {
        foreach (HttpResponseMessage response in responses)
        {
            response.Dispose();
        }
    }

    /// <summary>
    ///     Raises <see cref="HttpClient.Timeout" /> when it is below <see cref="ArchitectureRequestBurstHttpTimeout" />.
    ///     Safe to call after traffic has started: .NET forbids mutating <see cref="HttpClient.Timeout" /> then, so we no-op
    ///     when the setter throws (timeout should already be adequate if callers aligned before the first request).
    /// </summary>
    internal static void AlignHttpClientTimeoutForSqlIdempotencyLockChain(
        HttpClient client,
        TimeSpan? minimumTimeout = null)
    {
        if (client is null)
            throw new ArgumentNullException(nameof(client));

        TimeSpan required = minimumTimeout ?? ArchitectureRequestBurstHttpTimeout;

        if (client.Timeout >= required)
            return;

        try
        {
            client.Timeout = required;
        }
        catch (InvalidOperationException)
        {
            // HttpClient disallows Timeout changes after SendAsync has started (warm GETs, parallel retries).
        }
    }
}
