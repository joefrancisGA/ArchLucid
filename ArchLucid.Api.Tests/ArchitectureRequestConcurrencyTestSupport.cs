using System.Net;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

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
    ///     (≤1 hour clamp; greenfield SQL tests configure ~25 minutes so waiters survive a ~20-minute pipeline winner).
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
    ///     Per-POST ceiling for <see cref="GreenfieldSqlApiFactory" /> (10 min <c>sp_getapplock</c> + 5 min pipeline + slack).
    ///     Parallel idempotency bursts after <see cref="WarmGreenfieldSqlHostForArchitectureRequestTestsAsync" /> should finish well
    ///     under this; it must stay below <see cref="ArchitectureRequestBurstHttpTimeout" /> so greenfield tests do not inherit
    ///     InMemory-factory budgets meant for hour-scale lock chains.
    /// </summary>
    internal static readonly TimeSpan GreenfieldSqlArchitectureRequestBurstHttpTimeout = TimeSpan.FromMinutes(32);

    /// <summary>DbUp + readiness + first create-run on an empty catalog (outside parallel-burst hang guards).</summary>
    internal static readonly TimeSpan GreenfieldSqlHostBootstrapBudget = TimeSpan.FromMinutes(30);

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
                responses[i].Dispose();
                await Task.Delay(delayMs, cancellationToken);
                delayMs = Math.Min(delayMs * 2, 4000);
                responses[i] =
                    await PostSingleArchitectureRequestAsync(client, body, idempotencyKey, cancellationToken);
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
        using CancellationTokenSource bootstrap = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        bootstrap.CancelAfter(GreenfieldSqlHostBootstrapBudget);
        CancellationToken ct = bootstrap.Token;

        AlignHttpClientTimeoutForSqlIdempotencyLockChain(client, GreenfieldSqlArchitectureRequestBurstHttpTimeout);
        await HealthReadyProbe.EnsureReadyAsync(client, ct);
        await WarmListRunsPathAsync(client, ct);

        if (!includePostCreateRunWarmup)
            return;

        await WarmSingleCreateRunPathAsync(client, ct);
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
                await response.EnsureSuccessStatusCode();
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
        object body = TestRequestFactory.CreateArchitectureRequest(
            "REQ-GREENFIELD-WARM-" + Guid.NewGuid().ToString("N")[..8]);
        string idempotencyKey = "greenfield-warm-" + Guid.NewGuid().ToString("N");

        using HttpResponseMessage response = await PostSingleArchitectureRequestWithGreenfieldTransientRetryAsync(
            client,
            body,
            idempotencyKey,
            cancellationToken);

        if (response.IsSuccessStatusCode)
            return;

        throw new InvalidOperationException(
            "POST /v1/architecture/request warmup failed with HTTP "
            + (int)response.StatusCode
            + " (expected success after transient SQL retries). See "
            + nameof(WarmGreenfieldSqlHostForArchitectureRequestTestsAsync)
            + ".");
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
