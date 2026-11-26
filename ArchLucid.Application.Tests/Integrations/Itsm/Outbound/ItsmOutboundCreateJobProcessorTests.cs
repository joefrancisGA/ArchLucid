using ArchLucid.Application.Integrations.Itsm.Outbound;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Integrations.Itsm.Outbound;

[Trait("Category", "Unit")]
public sealed class ItsmOutboundCreateJobProcessorTests
{
    [Theory]
    [InlineData(ItsmOutboundIssueProvider.Jira)]
    [InlineData(ItsmOutboundIssueProvider.ServiceNow)]
    public void Creates_for_providers_without_duplicate_protection_have_no_queue_retries(ItsmOutboundIssueProvider provider)
    {
        Assert.Equal(0, ItsmOutboundCreateJobProcessor.GetMaxRetries(provider, 5));
    }

    [Theory]
    [InlineData(ItsmOutboundIssueProvider.Jira, 503)]
    [InlineData(ItsmOutboundIssueProvider.Jira, 429)]
    [InlineData(ItsmOutboundIssueProvider.ServiceNow, 503)]
    [InlineData(ItsmOutboundIssueProvider.ServiceNow, 429)]
    public void ShouldRetryWorker_does_not_resubmit_jira_or_servicenow_vendor_failures(ItsmOutboundIssueProvider provider, int statusCode)
    {
        ItsmOutboundIssueCreationResult result = new()
        {
            Kind = ItsmOutboundCreateTerminalKind.VendorError,
            VendorStatusCode = statusCode,
        };

        Assert.False(ItsmOutboundCreateJobProcessor.ShouldRetryWorker(provider, result));
    }

    [Theory]
    [InlineData(ItsmOutboundIssueProvider.Jira)]
    [InlineData(ItsmOutboundIssueProvider.ServiceNow)]
    public void Correlation_save_failure_keeps_external_key_without_recreating_ticket(ItsmOutboundIssueProvider provider)
    {
        ItsmOutboundIssueCreationResult result = new()
        {
            Kind = ItsmOutboundCreateTerminalKind.CorrelationPersistenceFailed,
            ExternalKey = "TEST-42",
        };

        Assert.False(ItsmOutboundCreateJobProcessor.ShouldRetryWorker(provider, result));
        Assert.Equal("TEST-42", ItsmOutboundCreateJobProcessor.ToJobResult(result, provider).ExternalKey);
    }

    [Theory]
    [InlineData(-1, 0)]
    [InlineData(3, 3)]
    [InlineData(11, 10)]
    public void GetMaxRetries_preserves_existing_azure_boards_configuration(int configuredMaxRetries, int expected)
    {
        Assert.Equal(expected, ItsmOutboundCreateJobProcessor.GetMaxRetries(ItsmOutboundIssueProvider.AzureBoards, configuredMaxRetries));
    }

    [Fact]
    public void ShouldRetryWorker_azure_boards_correlation_persistence_failed_returns_true()
    {
        ItsmOutboundIssueCreationResult result = new() { Kind = ItsmOutboundCreateTerminalKind.CorrelationPersistenceFailed };

        ItsmOutboundCreateJobProcessor.ShouldRetryWorker(ItsmOutboundIssueProvider.AzureBoards, result).Should().BeTrue();
    }

    [Fact]
    public void ShouldRetryWorker_azure_boards_vendor_503_returns_true()
    {
        ItsmOutboundIssueCreationResult result = new()
        {
            Kind = ItsmOutboundCreateTerminalKind.VendorError,
            VendorStatusCode = 503
        };

        ItsmOutboundCreateJobProcessor.ShouldRetryWorker(ItsmOutboundIssueProvider.AzureBoards, result).Should().BeTrue();
    }

    [Fact]
    public void ShouldRetryWorker_vendor_400_returns_false()
    {
        ItsmOutboundIssueCreationResult result = new()
        {
            Kind = ItsmOutboundCreateTerminalKind.VendorError,
            VendorStatusCode = 400
        };

        ItsmOutboundCreateJobProcessor.ShouldRetryWorker(ItsmOutboundIssueProvider.AzureBoards, result).Should().BeFalse();
    }

    [Fact]
    public void ShouldRetryWorker_skipped_returns_false()
    {
        ItsmOutboundIssueCreationResult result = new() { Kind = ItsmOutboundCreateTerminalKind.Skipped };

        ItsmOutboundCreateJobProcessor.ShouldRetryWorker(ItsmOutboundIssueProvider.AzureBoards, result).Should().BeFalse();
    }
}
