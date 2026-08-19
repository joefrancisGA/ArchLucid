using ArchLucid.Core.Integration;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.DataConsistency;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Host.Core.Integration;

using Azure.Messaging.ServiceBus;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Host.Core.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCorePackageCoverageBatch17Tests
{
    [Fact]
    public void WeeklyArchitectureDigestPollingDefaults_exposes_expected_bounds()
    {
        WeeklyArchitectureDigestPollingDefaults.MinPollingIntervalHours.Should().Be(1);
        WeeklyArchitectureDigestPollingDefaults.MaxPollingIntervalHours.Should().Be(24 * 365);
    }

    [Theory]
    [InlineData(DataConsistencyEnforcementMode.Alert, true)]
    [InlineData(DataConsistencyEnforcementMode.Quarantine, true)]
    [InlineData(DataConsistencyEnforcementMode.Warn, false)]
    public void DataConsistencyEnforcementPolicy_UsesAlertCounters_reflects_mode(DataConsistencyEnforcementMode mode, bool expected)
    {
        DataConsistencyEnforcementPolicy.UsesAlertCounters(mode).Should().Be(expected);
    }

    [Theory]
    [InlineData(DataConsistencyEnforcementMode.Quarantine, false, 3, true)]
    [InlineData(DataConsistencyEnforcementMode.Warn, true, 0, false)]
    [InlineData(DataConsistencyEnforcementMode.Warn, true, 2, true)]
    public void DataConsistencyEnforcementPolicy_ShouldAttemptOrphanRowQuarantine_requires_positive_orphans_and_gate(
        DataConsistencyEnforcementMode mode,
        bool autoQuarantine,
        long orphanCount,
        bool expected)
    {
        DataConsistencyEnforcementPolicy.ShouldAttemptOrphanRowQuarantine(mode, autoQuarantine, orphanCount)
            .Should()
            .Be(expected);
    }

    [Fact]
    public void IntegrationEventServiceBusMessageDispatch_ResolveEventType_prefers_application_property()
    {
        ServiceBusReceivedMessage fromProperty = ServiceBusModelFactory.ServiceBusReceivedMessage(
            properties: new Dictionary<string, object> { ["event_type"] = "  com.archlucid.alert.fired  " });

        ServiceBusReceivedMessage fromSubject = ServiceBusModelFactory.ServiceBusReceivedMessage(subject: "com.archlucid.alert.resolved");

        IntegrationEventServiceBusMessageDispatch.ResolveEventType(fromProperty)
            .Should()
            .Be("com.archlucid.alert.fired");
        IntegrationEventServiceBusMessageDispatch.ResolveEventType(fromSubject)
            .Should()
            .Be("com.archlucid.alert.resolved");
        IntegrationEventServiceBusMessageDispatch.ResolveEventType(ServiceBusModelFactory.ServiceBusReceivedMessage())
            .Should()
            .BeEmpty();
    }

    [Fact]
    public void IntegrationEventServiceBusMessageDispatch_ResolveHandlers_prefers_specific_handlers_over_wildcard()
    {
        Mock<IIntegrationEventHandler> specific = new();
        specific.SetupGet(h => h.EventType).Returns(IntegrationEventTypes.AlertFiredV1);

        Mock<IIntegrationEventHandler> wildcard = new();
        wildcard.SetupGet(h => h.EventType).Returns(IntegrationEventTypes.WildcardEventType);

        IReadOnlyList<IIntegrationEventHandler> resolved =
            IntegrationEventServiceBusMessageDispatch.ResolveHandlers(
                [specific.Object, wildcard.Object],
                IntegrationEventTypes.AlertFiredV1);

        resolved.Should().ContainSingle().Which.Should().BeSameAs(specific.Object);
    }

    [Fact]
    public void IntegrationEventServiceBusMessageDispatch_ResolveHandlers_falls_back_to_wildcard_when_no_specific_match()
    {
        Mock<IIntegrationEventHandler> wildcard = new();
        wildcard.SetupGet(h => h.EventType).Returns(IntegrationEventTypes.WildcardEventType);

        IReadOnlyList<IIntegrationEventHandler> resolved =
            IntegrationEventServiceBusMessageDispatch.ResolveHandlers(
                [wildcard.Object],
                IntegrationEventTypes.AlertFiredV1);

        resolved.Should().ContainSingle().Which.Should().BeSameAs(wildcard.Object);
    }

    [Fact]
    public async Task IntegrationEventServiceBusMessageDispatch_ProcessPeekLockedMessageAsync_dead_letters_missing_event_type()
    {
        RecordingSettlement settlement = new();
        ServiceBusReceivedMessage message = ServiceBusModelFactory.ServiceBusReceivedMessage(body: BinaryData.FromString("{}"));

        await IntegrationEventServiceBusMessageDispatch.ProcessPeekLockedMessageAsync(
            message,
            settlement,
            [],
            NullLogger.Instance,
            CancellationToken.None);

        settlement.DeadLetterReason.Should().Be("MissingEventType");
        settlement.Completed.Should().BeFalse();
    }

    [Fact]
    public async Task IntegrationEventServiceBusMessageDispatch_ProcessPeekLockedMessageAsync_dead_letters_when_no_handler_registered()
    {
        RecordingSettlement settlement = new();
        ServiceBusReceivedMessage message = ServiceBusModelFactory.ServiceBusReceivedMessage(
            body: BinaryData.FromString("{}"),
            properties: new Dictionary<string, object> { ["event_type"] = IntegrationEventTypes.AlertFiredV1 });

        await IntegrationEventServiceBusMessageDispatch.ProcessPeekLockedMessageAsync(
            message,
            settlement,
            [],
            NullLogger.Instance,
            CancellationToken.None);

        settlement.DeadLetterReason.Should().Be("NoHandler");
    }

    [Fact]
    public async Task IntegrationEventServiceBusMessageDispatch_ProcessPeekLockedMessageAsync_completes_after_successful_handler()
    {
        RecordingSettlement settlement = new();
        Mock<IIntegrationEventHandler> handler = new();
        handler.SetupGet(h => h.EventType).Returns(IntegrationEventTypes.AlertFiredV1);
        handler.Setup(h => h.HandleAsync(It.IsAny<ReadOnlyMemory<byte>>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ServiceBusReceivedMessage message = ServiceBusModelFactory.ServiceBusReceivedMessage(
            body: BinaryData.FromString("""{"ok":true}"""),
            properties: new Dictionary<string, object> { ["event_type"] = IntegrationEventTypes.AlertFiredV1 });

        await IntegrationEventServiceBusMessageDispatch.ProcessPeekLockedMessageAsync(
            message,
            settlement,
            [handler.Object],
            NullLogger.Instance,
            CancellationToken.None);

        settlement.Completed.Should().BeTrue();
        handler.Verify(h => h.HandleAsync(It.IsAny<ReadOnlyMemory<byte>>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task IntegrationEventServiceBusMessageDispatch_ProcessPeekLockedMessageAsync_abandons_on_handler_failure()
    {
        RecordingSettlement settlement = new();
        Mock<IIntegrationEventHandler> handler = new();
        handler.SetupGet(h => h.EventType).Returns(IntegrationEventTypes.AlertFiredV1);
        handler.Setup(h => h.HandleAsync(It.IsAny<ReadOnlyMemory<byte>>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("handler failed"));

        ServiceBusReceivedMessage message = ServiceBusModelFactory.ServiceBusReceivedMessage(
            body: BinaryData.FromString("{}"),
            properties: new Dictionary<string, object> { ["event_type"] = IntegrationEventTypes.AlertFiredV1 });

        await IntegrationEventServiceBusMessageDispatch.ProcessPeekLockedMessageAsync(
            message,
            settlement,
            [handler.Object],
            NullLogger.Instance,
            CancellationToken.None);

        settlement.Abandoned.Should().BeTrue();
        settlement.Completed.Should().BeFalse();
    }

    private sealed class RecordingSettlement : IIntegrationEventPeekLockSettlement
    {
        public bool Completed
        {
            get;
            private set;
        }

        public bool Abandoned
        {
            get;
            private set;
        }

        public string? DeadLetterReason
        {
            get;
            private set;
        }

        public Task CompleteAsync(ServiceBusReceivedMessage message, CancellationToken cancellationToken)
        {
            Completed = true;

            return Task.CompletedTask;
        }

        public Task AbandonAsync(ServiceBusReceivedMessage message, CancellationToken cancellationToken)
        {
            Abandoned = true;

            return Task.CompletedTask;
        }

        public Task DeadLetterAsync(
            ServiceBusReceivedMessage message,
            string deadLetterReason,
            string deadLetterErrorDescription,
            CancellationToken cancellationToken)
        {
            DeadLetterReason = deadLetterReason;

            return Task.CompletedTask;
        }
    }
}
