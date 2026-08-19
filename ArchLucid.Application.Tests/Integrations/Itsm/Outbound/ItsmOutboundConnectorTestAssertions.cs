using ArchLucid.Application.Integrations.Itsm.Outbound;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

internal static class ItsmOutboundConnectorTestAssertions
{
    public static void AssertClearTerminalOutcome(
        string connectorName,
        ItsmOutboundIssueCreationResult result,
        ItsmOutboundCreateTerminalKind expectedKind)
    {
        if (string.IsNullOrWhiteSpace(connectorName))
            throw new ArgumentException("connectorName is required.", nameof(connectorName));

        ArgumentNullException.ThrowIfNull(result);

        result.Kind.Should().Be(expectedKind, because: $"{connectorName}: terminal kind must match the outbound contract.");
        result.Kind.Should().NotBe(ItsmOutboundCreateTerminalKind.None, because: $"{connectorName}: outcomes must never be None.");
        result.UserMessage.Should().NotBeNullOrWhiteSpace(because: $"{connectorName}: operator-facing UserMessage is required for all terminals.");
        result.AuditEvents.Should().NotBeEmpty(because: $"{connectorName}: at least one audit row is required for operator traceability.");
    }
}
