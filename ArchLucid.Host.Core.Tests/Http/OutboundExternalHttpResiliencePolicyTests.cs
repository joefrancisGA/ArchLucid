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
    public void Create_with_defaults_returns_non_null_policy()
    {
        IAsyncPolicy<HttpResponseMessage> policy = OutboundExternalHttpResiliencePolicy.Create(new OutboundExternalHttpResilienceOptions());

        policy.Should().NotBeNull();
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
