using System.Net;

using ArchLucid.Host.Core.Http;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Polly;
using Polly.CircuitBreaker;

namespace ArchLucid.Host.Core.Tests.Http;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AzureRetailPricesHttpResiliencePolicyTests
{
    [Fact]
    public async Task Policy_execute_opens_circuit_after_five_consecutive_failures()
    {
        Always503Handler primary = new();

        IAsyncPolicy<HttpResponseMessage> policy = AzureRetailPricesHttpResiliencePolicy.Create(
            NullLoggerFactory.Instance.CreateLogger("tests"),
            static _ => TimeSpan.Zero);

        for (int i = 0; i < AzureRetailPricesHttpResiliencePolicy.CircuitBreakerFailureThreshold; i++)
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

    private sealed class Always503Handler : HttpMessageHandler
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
