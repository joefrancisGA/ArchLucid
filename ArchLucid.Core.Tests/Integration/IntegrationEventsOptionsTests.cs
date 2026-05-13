using ArchLucid.Core.Integration;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Integration;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class IntegrationEventsOptionsTests
{
    [Fact]
    public void SectionName_matches_appsettings_group()
    {
        IntegrationEventsOptions.SectionName.Should().Be("IntegrationEvents");
    }

    [Fact]
    public void Defaults_match_outbox_and_processor_baseline()
    {
        IntegrationEventsOptions o = new();

        o.ServiceBusConnectionString.Should().BeNull();
        o.ServiceBusFullyQualifiedNamespace.Should().BeNull();
        o.ServiceBusManagedIdentityClientId.Should().BeNull();
        o.QueueOrTopicName.Should().BeNull();
        o.TransactionalOutboxEnabled.Should().BeFalse();
        o.OutboxMaxPublishAttempts.Should().Be(6);
        o.OutboxMaxBackoffSeconds.Should().Be(300);
        o.ConsumerEnabled.Should().BeFalse();
        o.SubscriptionName.Should().BeNull();
        o.MaxConcurrentCalls.Should().Be(4);
        o.PrefetchCount.Should().Be(0);
    }

    [Fact]
    public void Properties_round_trip_for_binding_layer()
    {
        IntegrationEventsOptions o = new()
        {
            ServiceBusConnectionString = "Endpoint=sb://x;",
            ServiceBusFullyQualifiedNamespace = "ns.servicebus.windows.net",
            ServiceBusManagedIdentityClientId = "msi-client",
            QueueOrTopicName = "events",
            TransactionalOutboxEnabled = true,
            OutboxMaxPublishAttempts = 10,
            OutboxMaxBackoffSeconds = 120,
            ConsumerEnabled = true,
            SubscriptionName = "workers",
            MaxConcurrentCalls = 8,
            PrefetchCount = 32,
        };

        o.ServiceBusConnectionString.Should().Be("Endpoint=sb://x;");
        o.ServiceBusFullyQualifiedNamespace.Should().Be("ns.servicebus.windows.net");
        o.ServiceBusManagedIdentityClientId.Should().Be("msi-client");
        o.QueueOrTopicName.Should().Be("events");
        o.TransactionalOutboxEnabled.Should().BeTrue();
        o.OutboxMaxPublishAttempts.Should().Be(10);
        o.OutboxMaxBackoffSeconds.Should().Be(120);
        o.ConsumerEnabled.Should().BeTrue();
        o.SubscriptionName.Should().Be("workers");
        o.MaxConcurrentCalls.Should().Be(8);
        o.PrefetchCount.Should().Be(32);
    }
}
