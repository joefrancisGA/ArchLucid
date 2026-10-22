using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;
using ArchLucid.Decisioning.Merge;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Merge;

[Trait("Category", "Unit")]
public sealed class ManifestGovernanceMergerTests
{
    [Fact]
    public void ApplyGovernanceDefaults_does_not_treat_unmanaged_identity_as_managed_identity()
    {
        ArchitectureRequest request = new()
        {
            RequiredCapabilities = ["unmanaged identity"],
        };
        GoldenManifest manifest = new();
        DecisionMergeResult output = new();

        new ManifestGovernanceMerger().ApplyGovernanceDefaults(manifest, request, [], output);

        manifest.Governance.RequiredControls.Should().NotContain("Managed Identity");
    }
}
