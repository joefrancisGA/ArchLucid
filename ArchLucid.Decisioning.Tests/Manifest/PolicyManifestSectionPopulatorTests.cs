using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Manifest;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Manifest.Builders;
using ArchLucid.Decisioning.Models;

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
            control.PolicyPack == PolicyManifestSectionPopulator.PolicyPackNotStoredLabel);
        manifest.Policy.SatisfiedControls.Should().NotContain(control =>
            control.PolicyPack == "Inferred");
    }

    [Fact]
    public void Populate_uses_not_stored_label_when_policy_reference_blank()
    {
        FindingsSnapshot snapshot = new()
        {
            FindingsSnapshotId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Findings =
            [
                new Finding
                {
                    FindingId = "policy-1",
                    FindingType = FindingTypes.PolicyApplicabilityFinding,
                    Category = "Policy",
                    EngineType = "test",
                    Severity = FindingSeverity.Info,
                    Title = "Applies",
                    Rationale = "ok",
                    Payload = new PolicyApplicabilityFindingPayload
                    {
                        PolicyName = "SOC2",
                        PolicyReference = "  ",
                        ApplicableTopologyResourceCount = 1,
                    },
                },
            ],
        };

        ManifestDocument manifest = new() { ManifestId = Guid.NewGuid(), RunId = Guid.NewGuid() };
        PolicyManifestSectionPopulator populator = new();

        populator.Populate(manifest, new FindingsSnapshotTypeIndex(snapshot));

        manifest.Policy.SatisfiedControls.Should().ContainSingle(control =>
            control.PolicyPack == PolicyManifestSectionPopulator.PolicyPackNotStoredLabel);
        manifest.Policy.SatisfiedControls.Should().NotContain(control =>
            control.PolicyPack.Equals("Inferred", StringComparison.OrdinalIgnoreCase));
    }
}
