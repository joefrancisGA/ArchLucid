using ArchLucid.Core.Integration;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Core.Tests.Integration;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class IntegrationEventsOptionsValidatorTests
{
    private readonly IntegrationEventsOptionsValidator _sut = new();

    [Fact]
    public void Validate_defaults_succeed()
    {
        ValidateOptionsResult result = _sut.Validate(Options.DefaultName, new IntegrationEventsOptions());

        result.Succeeded.Should().BeTrue();
    }

    [Fact]
    public void Validate_queue_without_transport_fails()
    {
        IntegrationEventsOptions options = new() { QueueOrTopicName = "events" };

        ValidateOptionsResult result = _sut.Validate(Options.DefaultName, options);

        result.Failed.Should().BeTrue();
        result.Failures.Should().Contain(f => f.Contains(nameof(IntegrationEventsOptions.QueueOrTopicName), StringComparison.Ordinal));
    }

    [Fact]
    public void Validate_queue_with_namespace_succeeds()
    {
        IntegrationEventsOptions options = new()
        {
            QueueOrTopicName = "events",
            ServiceBusFullyQualifiedNamespace = "ns.servicebus.windows.net",
        };

        ValidateOptionsResult result = _sut.Validate(Options.DefaultName, options);

        result.Succeeded.Should().BeTrue();
    }

    [Fact]
    public void Validate_consumer_enabled_without_subscription_fails()
    {
        IntegrationEventsOptions options = new()
        {
            ConsumerEnabled = true,
            QueueOrTopicName = "events",
            ServiceBusConnectionString = "Endpoint=sb://x;",
        };

        ValidateOptionsResult result = _sut.Validate(Options.DefaultName, options);

        result.Failed.Should().BeTrue();
        result.Failures.Should().Contain(f => f.Contains(nameof(IntegrationEventsOptions.SubscriptionName), StringComparison.Ordinal));
    }

    [Fact]
    public void Validate_invalid_replay_webhook_url_fails()
    {
        IntegrationEventsOptions options = new() { ReplayWebhookReceiverUrl = "not-a-uri" };

        ValidateOptionsResult result = _sut.Validate(Options.DefaultName, options);

        result.Failed.Should().BeTrue();
        result.Failures.Should().Contain(f => f.Contains(nameof(IntegrationEventsOptions.ReplayWebhookReceiverUrl), StringComparison.Ordinal));
    }

    [Fact]
    public void Validate_outbox_bounds_must_be_positive()
    {
        IntegrationEventsOptions options = new()
        {
            OutboxMaxPublishAttempts = 0,
            OutboxMaxBackoffSeconds = 0,
            MaxConcurrentCalls = 0,
            PrefetchCount = -1,
        };

        ValidateOptionsResult result = _sut.Validate(Options.DefaultName, options);

        result.Failed.Should().BeTrue();
        result.Failures.Should().HaveCountGreaterThanOrEqualTo(4);
    }
}
