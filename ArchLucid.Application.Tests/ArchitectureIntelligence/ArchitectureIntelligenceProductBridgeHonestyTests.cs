using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Governance.Posture;
using FluentAssertions;

namespace ArchLucid.Application.Tests.ArchitectureIntelligence;

[Trait("Category", "Unit")]
public sealed class ArchitectureIntelligenceProductBridgeHonestyTests
{
    [Fact]
    public void ToFindings_omitted_severity_does_not_store_warning_default()
    {
        SpecialistReviewFinding finding = new()
        {
            FindingId = "finding-omitted-severity",
            Dimension = QualityDimension.Security,
            Title = "Title",
            Rationale = "Rationale",
            Conclusion = ReviewConclusion.Fail,
            Severity = "",
        };

        Finding mapped = ArchitectureIntelligenceProductBridge.ToFindings([finding]).Single();

        mapped.Severity.Should().Be(FindingSeverity.Info);
        mapped.Properties["architectureIntelligence.severityStored"].Should().Be(bool.FalseString);
    }

    [Fact]
    public void ToFindings_medium_severity_does_not_store_warning_default()
    {
        SpecialistReviewFinding finding = new()
        {
            FindingId = "finding-medium",
            Dimension = QualityDimension.Security,
            Title = "Title",
            Rationale = "Rationale",
            Conclusion = ReviewConclusion.Fail,
            Severity = "Medium",
        };

        Finding mapped = ArchitectureIntelligenceProductBridge.ToFindings([finding]).Single();

        mapped.Severity.Should().Be(FindingSeverity.Info);
        mapped.Properties["architectureIntelligence.severityStored"].Should().Be(bool.FalseString);
    }

    [Fact]
    public void ToFindings_stored_high_preserves_specialist_severity_label()
    {
        SpecialistReviewFinding finding = new()
        {
            FindingId = "finding-high",
            Dimension = QualityDimension.Security,
            Title = "Title",
            Rationale = "Rationale",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
        };

        Finding mapped = ArchitectureIntelligenceProductBridge.ToFindings([finding]).Single();

        mapped.Severity.Should().Be(FindingSeverity.Error);
        mapped.Properties["architectureIntelligence.severityStored"].Should().Be(bool.TrueString);
        mapped.Properties["architectureIntelligence.specialistSeverity"].Should().Be("High");
    }

    [Fact]
    public void ToFindings_unrecognized_disposition_marks_human_review_not_stored()
    {
        SpecialistReviewFinding finding = new()
        {
            FindingId = "finding-disposition",
            Dimension = QualityDimension.Security,
            Title = "Title",
            Rationale = "Rationale",
            Conclusion = ReviewConclusion.Fail,
            Severity = "High",
            GovernanceDisposition = (GovernanceDisposition)99,
        };

        Finding mapped = ArchitectureIntelligenceProductBridge.ToFindings([finding]).Single();

        mapped.Properties["architectureIntelligence.humanReviewStatusStored"].Should().Be(bool.FalseString);
    }

    [Fact]
    public void Embed_leaves_blank_policy_rule_id_unset()
    {
        Finding finding = new()
        {
            FindingId = "embedded-1",
            FindingType = "ArchitectureIntelligence.SpecialistReview",
            Category = "ArchitectureIntelligence",
            EngineType = "ArchitectureIntelligence",
            Title = "Title",
            Rationale = "Rationale",
            PolicyRuleId = null,
        };

        List<Finding> embedded = SpecialistFindingAuthorityEmbedding.Embed([finding]);

        embedded.Should().ContainSingle();
        embedded[0].PolicyRuleId.Should().BeNull();
    }
}
