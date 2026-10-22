using ArchLucid.Contracts.Governance.Resolution;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance.Resolution;

[Trait("Category", "Unit")]
public sealed class CommittedEffectiveGovernanceSnapshotExportFormatterTests
{
    [Fact]
    public void FormatReadmeHeadline_returns_null_when_snapshot_missing()
    {
        CommittedEffectiveGovernanceSnapshotExportFormatter.FormatReadmeHeadline(null).Should().BeNull();
    }

    [Fact]
    public void FormatReadmeDetailLines_lists_packs_dimensions_and_exclusions()
    {
        Guid packId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        CommittedEffectiveGovernanceSnapshotDescriptor snapshot = new()
        {
            HasEffectivePolicy = true,
            ComplianceRuleKeyCount = 2,
            ConflictCount = 1,
            PackAssignments =
            [
                new CommittedGovernancePackAssignmentSnapshot
                {
                    PolicyPackId = packId,
                    PolicyPackVersion = "2.1.0",
                    ScopeLevel = "Project",
                },
            ],
            CoverageAssignments =
            [
                new CommittedCoverageAssignmentSnapshot
                {
                    PolicyPackId = packId,
                    PolicyPackVersion = "2.1.0",
                    QualityDimension = "Security",
                    CoverageType = "QualityDimension",
                    SelectionState = "Excluded",
                    ExclusionReason = "Focused pilot scope",
                    EvaluationVersion = "1",
                },
            ],
        };

        CommittedEffectiveGovernanceSnapshotExportFormatter.FormatReadmeHeadline(snapshot)
            .Should()
            .Be("1 pack assignment(s), 2 compliance rule key(s)");

        IReadOnlyList<string> lines =
            CommittedEffectiveGovernanceSnapshotExportFormatter.FormatReadmeDetailLines(snapshot);

        lines.Should().Contain($"  Pack: {packId:D} v2.1.0 (Project)");
        lines.Should().Contain($"  Coverage: {packId:D} v2.1.0 · Security · QualityDimension · Excluded · excluded: Focused pilot scope");
        lines.Should().Contain("  Merge conflicts at commit: 1");
    }

    [Fact]
    public void FormatProvenanceAppendixRows_includes_pack_and_coverage_sections()
    {
        Guid packId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        CommittedEffectiveGovernanceSnapshotDescriptor snapshot = new()
        {
            HasEffectivePolicy = true,
            ComplianceRuleKeyCount = 3,
            PackAssignments =
            [
                new CommittedGovernancePackAssignmentSnapshot
                {
                    PolicyPackId = packId,
                    PolicyPackVersion = "1.0.0",
                    ScopeLevel = "Tenant",
                },
            ],
            CoverageAssignments =
            [
                new CommittedCoverageAssignmentSnapshot
                {
                    PolicyPackId = packId,
                    PolicyPackVersion = "1.0.0",
                    QualityDimension = "Cost",
                    CoverageType = "QualityDimension",
                    SelectionState = "Included",
                    EvaluationVersion = "1",
                },
            ],
        };

        IReadOnlyList<(string Label, string Value)> rows =
            CommittedEffectiveGovernanceSnapshotExportFormatter.FormatProvenanceAppendixRows(snapshot);

        rows.Should().Contain(row => row.Label == "Pack assignments at commit" && row.Value.Contains(packId.ToString("D")));
        rows.Should().Contain(row => row.Label == "Coverage assignments at commit" && row.Value.Contains("Cost"));
        rows.Should().Contain(row => row.Label == "Compliance rule keys at commit" && row.Value == "3");
    }
}
