using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Manifest.Builders;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Manifest;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class PolicyManifestSectionPopulatorTests
{
    [Fact]
    public void Populate_uses_honesty_copy_when_policy_reference_is_missing()
    {
        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Findings =
            [
                new Finding
                {
                    FindingId = "policy-1",
                    FindingType = FindingTypes.PolicyApplicabilityFinding,
                    Severity = FindingSeverity.Info,
                    Payload = """{"policyName":"Encrypt data","applicableTopologyResourceCount":2}""",
                },
            ],
        };

        ManifestDocument manifest = new() { ManifestId = Guid.NewGuid(), RunId = Guid.NewGuid() };
        PolicyManifestSectionPopulator populator = new();

        populator.Populate(manifest, new FindingsSnapshotTypeIndex(snapshot));

        manifest.Policy.SatisfiedControls.Should().ContainSingle(control =>
            control.PolicyPack == "Policy reference was not stored.");
        manifest.Policy.SatisfiedControls.Should().NotContain(control =>
            control.PolicyPack == "Inferred");
    }
}
