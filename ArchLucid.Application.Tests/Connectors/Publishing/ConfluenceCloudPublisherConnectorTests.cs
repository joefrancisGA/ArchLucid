using ArchLucid.Application.Connectors.Publishing;
using ArchLucid.Core.Connectors.Publishing;
using ArchLucid.Core.Configuration;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Connectors.Publishing;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class ConfluenceCloudPublisherConnectorTests
{
    private sealed class ThrowOnSendHandler : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            throw new InvalidOperationException("HTTP should not be invoked for this scenario.");
        }
    }

    private sealed class QueueHandler : HttpMessageHandler
    {
        private readonly Queue<HttpResponseMessage> _responses = new();

        public void Enqueue(HttpResponseMessage response) => _responses.Enqueue(response);

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
        {
            return Task.FromResult(_responses.Dequeue());
        }
    }

    private static PublishRequest SampleRequest()
    {
        Guid z = Guid.Empty;

        return new PublishRequest(z, z, z, z, z, "1.0.0", "ok", "hello world", "ArchLucid page", null);
    }

    [Fact]
    public async Task PublishAsync_when_disabled_skips_http_and_returns_configuration_error()
    {
        ThrowOnSendHandler handler = new();
        using HttpClient http = new(handler) { BaseAddress = new Uri("https://example.atlassian.net/") };
        Mock<IOptionsMonitor<ConfluencePublishingOptions>> monitor = new();
        monitor.Setup(m => m.CurrentValue).Returns(new ConfluencePublishingOptions { Enabled = false, SpaceKey = "S" });
        ConfluenceCloudPublisherConnector sut =
            new(http, monitor.Object, NullLogger<ConfluenceCloudPublisherConnector>.Instance);

        PublishOutcome outcome = await sut.PublishAsync(SampleRequest(), CancellationToken.None);

        outcome.Succeeded.Should().BeFalse();
        outcome.FailureReason.Should().Be(ConfluencePublishFailureReason.BadResponse);
        outcome.ErrorMessage.Should().Contain("disabled");
    }

    [Fact]
    public async Task PublishAsync_when_enabled_but_space_missing_skips_http()
    {
        ThrowOnSendHandler handler = new();
        using HttpClient http = new(handler) { BaseAddress = new Uri("https://example.atlassian.net/") };
        Mock<IOptionsMonitor<ConfluencePublishingOptions>> monitor = new();
        monitor
            .Setup(m => m.CurrentValue)
            .Returns(new ConfluencePublishingOptions { Enabled = true, SpaceKey = "   " });
        ConfluenceCloudPublisherConnector sut =
            new(http, monitor.Object, NullLogger<ConfluenceCloudPublisherConnector>.Instance);

        PublishOutcome outcome = await sut.PublishAsync(SampleRequest(), CancellationToken.None);

        outcome.Succeeded.Should().BeFalse();
        outcome.FailureReason.Should().Be(ConfluencePublishFailureReason.BadResponse);
        outcome.ErrorMessage.Should().Contain("SpaceKey");
    }

    [Fact]
    public async Task PublishAsync_when_api_returns_429_maps_to_rate_limited()
    {
        QueueHandler handler = new();
        handler.Enqueue(new HttpResponseMessage(System.Net.HttpStatusCode.TooManyRequests));
        using HttpClient http = new(handler) { BaseAddress = new Uri("https://example.atlassian.net/") };
        Mock<IOptionsMonitor<ConfluencePublishingOptions>> monitor = new();
        monitor
            .Setup(m => m.CurrentValue)
            .Returns(new ConfluencePublishingOptions { Enabled = true, SpaceKey = "DOC" });
        ConfluenceCloudPublisherConnector sut =
            new(http, monitor.Object, NullLogger<ConfluenceCloudPublisherConnector>.Instance);

        PublishOutcome outcome = await sut.PublishAsync(SampleRequest(), CancellationToken.None);

        outcome.Succeeded.Should().BeFalse();
        outcome.FailureReason.Should().Be(ConfluencePublishFailureReason.RateLimited);
    }
}
