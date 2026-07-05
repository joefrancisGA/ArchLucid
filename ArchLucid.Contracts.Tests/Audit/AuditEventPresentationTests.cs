using ArchLucid.Contracts.Audit;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Audit;
[Trait("Category", "Unit")]

public sealed class AuditEventPresentationTests
{
    [Fact]
    public void FriendlyTitle_known_audit_codes_use_buyer_language()
    {
        Assert.Equal("Review started", AuditEventPresentation.FriendlyTitle("RunStarted"));
        Assert.Equal("Manifest finalized", AuditEventPresentation.FriendlyTitle("ManifestFinalized"));
        Assert.Equal("Governance approval requested", AuditEventPresentation.FriendlyTitle("GovernanceApprovalRequested"));
    }

    [Fact]
    public void LifecycleStage_maps_known_codes_into_coarse_groups()
    {
        Assert.Equal(ReviewAuditLifecycleStage.ReviewStarted, AuditEventPresentation.LifecycleStage("RunSubmitted"));
        Assert.Equal(ReviewAuditLifecycleStage.FindingsCaptured, AuditEventPresentation.LifecycleStage("FindingsSnapshotSealed"));
        Assert.Equal(ReviewAuditLifecycleStage.GovernanceHandoff, AuditEventPresentation.LifecycleStage("GovernanceApprovalRequested"));
    }

    [Fact]
    public void FriendlyTitle_unknown_event_humanizes_dotted_codes()
    {
        string title = AuditEventPresentation.FriendlyTitle("Custom.EventName");

        title.Should().Be("Eventname");
    }

    [Fact]
    public void FriendlyTitle_blank_event_returns_event_label()
    {
        AuditEventPresentation.FriendlyTitle("   ").Should().Be("Event");
    }

    [Fact]
    public void LifecycleStage_unknown_code_returns_other()
    {
        AuditEventPresentation.LifecycleStage("Custom.Audit").Should().Be(ReviewAuditLifecycleStage.Other);
    }
}
