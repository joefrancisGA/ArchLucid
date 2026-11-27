using System.Net;

using Polly;
using Polly.Retry;

namespace ArchLucid.Cli;

/// <summary>Retries transient HTTP failures for CLI reads and explicitly replay-protected writes.</summary>
internal sealed class CliRetryDelegatingHandler : DelegatingHandler
{
    private static readonly HttpRequestOptionsKey<string> SReplayProtectedWriteKey =
        new("ArchLucid.Cli.ReplayProtectedWriteKey");

    private readonly ResiliencePipeline<HttpResponseMessage>? _pipeline;

    public CliRetryDelegatingHandler(CliResilienceOptions? options = null)
    {
        CliResilienceOptions resolved = options ?? new CliResilienceOptions();
        resolved.Normalize();

        if (resolved.MaxRetryAttempts <= 0)
        {
            _pipeline = null;

            return;
        }

        _pipeline = new ResiliencePipelineBuilder<HttpResponseMessage>()
            .AddRetry(
                new RetryStrategyOptions<HttpResponseMessage>
                {
                    MaxRetryAttempts = resolved.MaxRetryAttempts,
                    Delay = TimeSpan.FromSeconds(resolved.InitialDelaySeconds),
                    BackoffType = DelayBackoffType.Exponential,
                    UseJitter = true,
                    ShouldHandle = new PredicateBuilder<HttpResponseMessage>()
                        .Handle<HttpRequestException>()
                        .HandleResult(static r =>
                            (int)r.StatusCode >= 500
                            || r.StatusCode == HttpStatusCode.RequestTimeout
                            || r.StatusCode == (HttpStatusCode)429)
                })
            .Build();
    }

    /// <summary>Opts in a write with a replayable body and a verified server-side idempotency contract.</summary>
    internal static void AllowReplayProtectedWrite(HttpRequestMessage request, string idempotencyKey)
    {
        request.Options.Set(SReplayProtectedWriteKey, idempotencyKey);
    }

    /// <inheritdoc />
    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request,
        CancellationToken cancellationToken)
    {
        if (_pipeline is null || !CanRetry(request))
            return await base.SendAsync(request, cancellationToken);

        return await _pipeline.ExecuteAsync(
            ct => new ValueTask<HttpResponseMessage>(base.SendAsync(request, ct)),
            cancellationToken);
    }

    private static bool CanRetry(HttpRequestMessage request)
    {
        if (request.Method == HttpMethod.Get || request.Method == HttpMethod.Head
            || request.Method == HttpMethod.Options || request.Method == HttpMethod.Trace)
            return true;

        // A header alone says nothing about whether this operation honors it.
        return request.Options.TryGetValue(SReplayProtectedWriteKey, out string? key)
            && !string.IsNullOrWhiteSpace(key)
            && request.Headers.TryGetValues("Idempotency-Key", out IEnumerable<string>? wireKeys)
            && wireKeys.SequenceEqual([key], StringComparer.Ordinal);
    }
}
