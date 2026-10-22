using ArchLucid.Persistence.Billing;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Billing;

[Trait("Category", "Unit")]
public sealed class BillingWebhookLedgerReplayPolicyTests
{
    [Theory]
    [InlineData("Received")]
    [InlineData("Processed")]
    [InlineData("received")]
    [InlineData("processed")]
    public void ShouldRejectDuplicateLedgerEntry_returns_true_for_in_flight_or_completed_status(string priorStatus)
    {
        BillingWebhookLedgerReplayPolicy.ShouldRejectDuplicateLedgerEntry(priorStatus).Should().BeTrue();
    }

    [Theory]
    [InlineData("Failed")]
    [InlineData("failed")]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void ShouldRejectDuplicateLedgerEntry_returns_false_for_failed_or_missing_status(string? priorStatus)
    {
        BillingWebhookLedgerReplayPolicy.ShouldRejectDuplicateLedgerEntry(priorStatus).Should().BeFalse();
    }
}
