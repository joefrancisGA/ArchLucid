using System.Text.Json;

using ArchLucid.Contracts.Governance.Resolution;
using ArchLucid.Persistence.Serialization;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance.Coverage;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class CommittedCoverageSnapshotTests
{
    [Fact]
    public void Descriptor_serializes_coverage_assignments_additively()
    {
        CommittedEffectiveGovernanceSnapshotDescriptor descriptor = new()
        {
            GeneratedUtc = DateTime.UtcNow,
            RuleSetId = "rules",
            RuleSetVersion = "1",
            RuleSetHash = "hash",
            CoverageAssignments =
            [
                new CommittedCoverageAssignmentSnapshot
                {
                    PolicyPackId = Guid.NewGuid(),
                    PolicyPackVersion = "1.0.0",
                    CoverageType = "ProviderNeutralBaseline",
                    SelectionState = "AlwaysActive",
                    EvaluationVersion = "coverage-v1",
                    QualityDimension = "Security",
                },
            ],
        };

        string json = JsonSerializer.Serialize(descriptor, AuditJsonSerializationOptions.Instance);
        json.Should().Contain("coverageAssignments");
        json.Should().Contain("Security");
    }

    [Fact]
    public void Descriptor_without_coverage_assignments_deserializes_with_empty_list()
    {
        const string legacyJson = """
                                  {
                                    "GeneratedUtc": "2026-01-01T00:00:00Z",
                                    "RuleSetId": "rules",
                                    "RuleSetVersion": "1",
                                    "RuleSetHash": "hash",
                                    "ComplianceRuleKeyCount": 0,
                                    "ComplianceRuleKeys": [],
                                    "ConflictCount": 0,
                                    "PackAssignments": [],
                                    "HasEffectivePolicy": false
                                  }
                                  """;

        CommittedEffectiveGovernanceSnapshotDescriptor? descriptor =
            JsonSerializer.Deserialize<CommittedEffectiveGovernanceSnapshotDescriptor>(
                legacyJson,
                AuditJsonSerializationOptions.Instance);

        descriptor.Should().NotBeNull();
        descriptor!.CoverageAssignments.Should().NotBeNull();
        descriptor.CoverageAssignments.Should().BeEmpty();
    }
}
