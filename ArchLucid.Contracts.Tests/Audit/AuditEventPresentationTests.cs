using ArchLucid.Contracts.Audit;

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
}
