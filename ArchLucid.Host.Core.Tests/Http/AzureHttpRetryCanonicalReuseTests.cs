using System.Net;

using CoreRetryPolicy = ArchLucid.Core.Http.AzureRmAndRetailPricesHttpRetryPolicy;
using HostRetryPolicy = ArchLucid.Host.Core.Http.AzureRmAndRetailPricesHttpRetryPolicy;

using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;

using Polly;

namespace ArchLucid.Host.Core.Tests.Http;

/// <summary>Behavioral and structural contract: Host.Core reuses Core's Azure HTTP retry pipeline.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AzureHttpRetryCanonicalReuseTests
{
    private static IEnumerable<IAsyncPolicy<HttpResponseMessage>> CreatePolicies() =>
    [
        CoreRetryPolicy.Create(NullLogger.Instance, static _ => TimeSpan.Zero),
        HostRetryPolicy.Create(NullLogger.Instance, static _ => TimeSpan.Zero)
    ];

    [Theory]
    [InlineData(HttpStatusCode.RequestTimeout, 4)]
    [InlineData(HttpStatusCode.TooManyRequests, 4)]
    [InlineData(HttpStatusCode.InternalServerError, 4)]
    [InlineData(HttpStatusCode.BadGateway, 4)]
    [InlineData(HttpStatusCode.ServiceUnavailable, 4)]
    [InlineData(HttpStatusCode.GatewayTimeout, 4)]
    [InlineData(HttpStatusCode.BadRequest, 1)]
    [InlineData(HttpStatusCode.Unauthorized, 1)]
    [InlineData(HttpStatusCode.Forbidden, 1)]
    [InlineData(HttpStatusCode.NotFound, 1)]
    public async Task Core_and_host_share_exact_status_retry_behavior(HttpStatusCode status, int expectedCalls)
    {
        foreach (IAsyncPolicy<HttpResponseMessage> policy in CreatePolicies())
        {
            int calls = 0;
            using HttpResponseMessage response = await policy.ExecuteAsync(_ =>
            {
                calls++;
                return Task.FromResult(new HttpResponseMessage(status));
            }, CancellationToken.None);

            Assert.Equal(status, response.StatusCode);
            Assert.Equal(expectedCalls, calls);
        }
        Assert.Equal(CoreRetryPolicy.MaxRetryAttempts, HostRetryPolicy.MaxRetryAttempts);
    }

    [Fact]
    public async Task Core_and_host_retry_transport_faults_without_retrying_caller_cancellation()
    {
        foreach (IAsyncPolicy<HttpResponseMessage> policy in CreatePolicies())
        {
            int calls = 0;
            using HttpResponseMessage recovered = await policy.ExecuteAsync(_ =>
            {
                calls++;
                if (calls == 1)
                    throw new HttpRequestException("transient transport failure");

                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK));
            }, CancellationToken.None);
            Assert.Equal(HttpStatusCode.OK, recovered.StatusCode);
            Assert.Equal(2, calls);
        }

        foreach (IAsyncPolicy<HttpResponseMessage> policy in CreatePolicies())
        {
            using CancellationTokenSource cts = new();
            int calls = 0;
            await Assert.ThrowsAnyAsync<OperationCanceledException>(async () =>
                await policy.ExecuteAsync(ct =>
                {
                    calls++;
                    cts.Cancel();
                    ct.ThrowIfCancellationRequested();
                    return Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK));
                }, cts.Token));
            Assert.Equal(1, calls);
        }
    }

    [Fact]
    public async Task Host_facade_preserves_single_rate_limit_retry_after_log()
    {
        RecordingLogger logger = new();
        IAsyncPolicy<HttpResponseMessage> policy = HostRetryPolicy.Create(logger, static _ => TimeSpan.Zero);
        int calls = 0;

        using HttpResponseMessage final = await policy.ExecuteAsync(_ =>
        {
            calls++;
            HttpResponseMessage response = new(
                calls == 1 ? HttpStatusCode.TooManyRequests : HttpStatusCode.OK);
            if (calls == 1)
                response.Headers.RetryAfter = new System.Net.Http.Headers.RetryConditionHeaderValue(
                    TimeSpan.FromSeconds(7));
            return Task.FromResult(response);
        }, CancellationToken.None);

        Assert.Equal(HttpStatusCode.OK, final.StatusCode);
        Assert.Equal(2, calls);
        string warning = Assert.Single(logger.Warnings);
        Assert.Contains("Retry-After=7", warning, StringComparison.Ordinal);
        Assert.Contains("rate limit", warning, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void Host_facade_must_delegate_and_must_not_construct_a_second_retry_pipeline()
    {
        const string relativePath = "ArchLucid.Host.Core/Http/AzureRmAndRetailPricesHttpRetryPolicy.cs";
        string? source = null;
        foreach (string start in new[] { Directory.GetCurrentDirectory(), AppContext.BaseDirectory })
        {
            for (DirectoryInfo? folder = new(start); folder is not null; folder = folder.Parent)
            {
                string candidate = Path.Combine(folder.FullName, relativePath);
                if (!File.Exists(candidate))
                    continue;
                source = File.ReadAllText(candidate);
                break;
            }
            if (source is not null)
                break;
        }

        Assert.NotNull(source);
        Assert.Contains("CanonicalAzureHttpRetryPolicy.Create(", source);
        Assert.Contains("CanonicalAzureHttpRetryPolicy.ShouldRetryHttpResponse(", source);
        Assert.DoesNotContain("ResiliencePipelineBuilder", source);
        Assert.DoesNotContain(".AddRetry(", source);
        Assert.DoesNotContain(".HandleResult(", source);
    }

    private sealed class RecordingLogger : ILogger
    {
        public List<string> Warnings { get; } = [];

        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => logLevel == LogLevel.Warning;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            if (IsEnabled(logLevel))
                Warnings.Add(formatter(state, exception));
        }
    }
}
