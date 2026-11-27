using System.Net;

using ArchLucid.Core.Http;
using ArchLucid.Host.Core.Http;

using FluentAssertions;

using Polly;
using Polly.CircuitBreaker;

namespace ArchLucid.Host.Core.Tests.Http;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class OutboundExternalHttpResiliencePolicyTests
{
    [Fact]
    public async Task Policy_execute_stops_calling_handler_after_sustained_failures_when_breaker_enabled()
    {
        AlwaysFailHandler primary = new();
        OutboundExternalHttpResilienceOptions options = new()
        {
            CircuitBreakerEnabled = true,
            FailureRatio = 0.5,
            SamplingDurationSeconds = 30,
            MinimumThroughput = 4,
            BreakDurationSeconds = 60,
            MaxRetryAttempts = 0,
        };

        IAsyncPolicy<HttpResponseMessage> policy =
            OutboundExternalHttpResiliencePolicy.Create(options, static _ => TimeSpan.Zero);

        for (int i = 0; i < options.MinimumThroughput; i++)
        {
            using HttpResponseMessage response = await policy.ExecuteAsync(
                primary.SendProbeAsync,
                CancellationToken.None);

            response.StatusCode.Should().Be(HttpStatusCode.ServiceUnavailable);
        }

        int sendsBeforeOpen = primary.SendCount;

        Func<Task> act = () => policy.ExecuteAsync(primary.SendProbeAsync, CancellationToken.None);

        await act.Should().ThrowAsync<BrokenCircuitException>();
        primary.SendCount.Should().Be(sendsBeforeOpen, "breaker should fail fast without new outbound calls");
    }

    [Fact]
    public async Task Retry_recovery_does_not_open_the_breaker_after_successful_logical_calls()
    {
        IAsyncPolicy<HttpResponseMessage> policy = OutboundExternalHttpResiliencePolicy.Create(
            new OutboundExternalHttpResilienceOptions
            {
                MinimumThroughput = 2,
                FailureRatio = 0.5,
                MaxRetryAttempts = 1,
            },
            static _ => TimeSpan.Zero);
        int sends = 0;

        Task<HttpResponseMessage> SendAsync(CancellationToken _) =>
            Task.FromResult(new HttpResponseMessage(++sends % 2 == 1
                ? HttpStatusCode.ServiceUnavailable
                : HttpStatusCode.OK));

        for (int i = 0; i < 3; i++)
        {
            using HttpResponseMessage response = await policy.ExecuteAsync(SendAsync, CancellationToken.None);
            response.StatusCode.Should().Be(HttpStatusCode.OK);
        }

        sends.Should().Be(6);
    }

    [Fact]
    public async Task Breaker_counts_nonretryable_auth_failures_in_logical_calls_even_with_retry_enabled()
    {
        IAsyncPolicy<HttpResponseMessage> policy = OutboundExternalHttpResiliencePolicy.Create(
            new OutboundExternalHttpResilienceOptions
            {
                MinimumThroughput = 2,
                FailureRatio = 0.5,
                MaxRetryAttempts = 2,
            },
            static _ => TimeSpan.Zero);
        int sends = 0;

        Task<HttpResponseMessage> SendAsync(CancellationToken _) =>
            Task.FromResult(new HttpResponseMessage(++sends == 1 ? HttpStatusCode.Unauthorized : HttpStatusCode.Forbidden));

        using HttpResponseMessage first = await policy.ExecuteAsync(SendAsync, CancellationToken.None);
        using HttpResponseMessage second = await policy.ExecuteAsync(SendAsync, CancellationToken.None);

        first.StatusCode.Should().Be(HttpStatusCode.Unauthorized);
        second.StatusCode.Should().Be(HttpStatusCode.Forbidden);
        sends.Should().Be(2, "authentication failures are not retried");

        Func<Task> read = () => policy.ExecuteAsync(SendAsync, CancellationToken.None);
        await read.Should().ThrowAsync<BrokenCircuitException>();
        sends.Should().Be(2, "an open circuit must not send more requests");
    }

    [Fact]
    public void Create_with_defaults_returns_non_null_policy()
    {
        IAsyncPolicy<HttpResponseMessage> policy = OutboundExternalHttpResiliencePolicy.Create(new OutboundExternalHttpResilienceOptions());

        policy.Should().NotBeNull();
    }

    [Theory]
    [InlineData(HttpStatusCode.RequestTimeout, 2)]
    [InlineData(HttpStatusCode.TooManyRequests, 2)]
    [InlineData(HttpStatusCode.ServiceUnavailable, 2)]
    [InlineData(HttpStatusCode.BadRequest, 1)]
    public async Task Outbound_retry_uses_shared_transient_http_classification(
        HttpStatusCode status, int expectedCalls)
    {
        OutboundExternalHttpResilienceOptions options = new()
        {
            CircuitBreakerEnabled = false,
            MaxRetryAttempts = 1
        };
        IAsyncPolicy<HttpResponseMessage> policy =
            OutboundExternalHttpResiliencePolicy.Create(options, static _ => TimeSpan.Zero);
        int calls = 0;
        using HttpResponseMessage response = await policy.ExecuteAsync(
            _ =>
            {
                calls++;
                return Task.FromResult(new HttpResponseMessage(status));
            }, CancellationToken.None);
        calls.Should().Be(expectedCalls);
    }

    private sealed class AlwaysFailHandler : HttpMessageHandler
    {
        public int SendCount
        {
            get; private set;
        }

        public Task<HttpResponseMessage> SendProbeAsync(CancellationToken cancellationToken) =>
            SendAsync(new HttpRequestMessage(HttpMethod.Get, "https://archlucid.test/fail"), cancellationToken);

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            SendCount++;

            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.ServiceUnavailable));
        }
    }
}
