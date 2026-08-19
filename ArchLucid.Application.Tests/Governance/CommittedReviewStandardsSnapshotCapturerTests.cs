using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Governance.PolicyPacks;
using ArchLucid.Core.Manifest;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CommittedReviewStandardsSnapshotCapturerTests
{
    [Fact]
    public void ApplyToManifest_persists_policy_refs_focused_scope_cloud_and_reviewed_dimensions()
    {
        CommittedReviewStandardsSnapshotCapturer sut = new();
        ManifestDocument manifest = new();
        ArchitectureRequest request = new()
        {
            CloudProvider = CloudProvider.Azure,
            PolicyReferences = [
                "enterprise-baseline",
                FocusedPilotModePolicyPacks.ReferenceToken
            ]
        };
        FindingsSnapshot findings = new()
        {
            Findings = [
                new Finding { Category = "Security" },
                new Finding { Category = "Cost" },
                new Finding { Category = "Security" }
            ]
        };

        sut.ApplyToManifest(manifest, request, findings);

        manifest.ReviewStandardsAtCommit.Should().NotBeNull();
        manifest.ReviewStandardsAtCommit!.CloudProvider.Should().Be(nameof(CloudProvider.Azure));
        manifest.ReviewStandardsAtCommit.FocusedPilotModeEnabled.Should().BeTrue();
        manifest.ReviewStandardsAtCommit.PolicyReferences.Should().BeEquivalentTo(["enterprise-baseline", FocusedPilotModePolicyPacks.ReferenceToken]);
        manifest.ReviewStandardsAtCommit.ReviewedQualityDimensions.Should().BeEquivalentTo(["Cost", "Security"]);
    }
}
