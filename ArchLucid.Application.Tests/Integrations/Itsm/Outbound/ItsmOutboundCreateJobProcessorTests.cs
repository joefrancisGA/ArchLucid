using ArchLucid.Application.Integrations.Itsm.Outbound;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

[Trait("Category", "Unit")]
public sealed class ItsmOutboundCreateJobProcessorTests
{
    [Fact]
    public void ShouldRetryWorker_correlation_persistence_failed_returns_true()
    {
        ItsmOutboundIssueCreationResult result = new() { Kind = ItsmOutboundCreateTerminalKind.CorrelationPersistenceFailed };

        ItsmOutboundCreateJobProcessor.ShouldRetryWorker(result).Should().BeTrue();
    }

    [Fact]
    public void ShouldRetryWorker_vendor_503_returns_true()
    {
        ItsmOutboundIssueCreationResult result = new()
        {
            Kind = ItsmOutboundCreateTerminalKind.VendorError,
            VendorStatusCode = 503
        };

        ItsmOutboundCreateJobProcessor.ShouldRetryWorker(result).Should().BeTrue();
    }

    [Fact]
    public void ShouldRetryWorker_vendor_400_returns_false()
    {
        ItsmOutboundIssueCreationResult result = new()
        {
            Kind = ItsmOutboundCreateTerminalKind.VendorError,
            VendorStatusCode = 400
        };

        ItsmOutboundCreateJobProcessor.ShouldRetryWorker(result).Should().BeFalse();
    }

    [Fact]
    public void ShouldRetryWorker_skipped_returns_false()
    {
        ItsmOutboundIssueCreationResult result = new() { Kind = ItsmOutboundCreateTerminalKind.Skipped };

        ItsmOutboundCreateJobProcessor.ShouldRetryWorker(result).Should().BeFalse();
    }
}
