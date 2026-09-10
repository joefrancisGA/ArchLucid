using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Decisioning")]
public sealed class FindingSemanticSupportBandDefaultsApplicatorTests
{
    [Fact]
    public void Apply_sets_not_scored_for_checklist_coverage()
    {
        Finding finding = new()
        {
            Classification = FindingClassification.ChecklistCoverage,
        };

        FindingSemanticSupportBandDefaultsApplicator.Apply([finding]);

        finding.SemanticSupportBand.Should().Be(FindingSemanticSupportBand.NotScored);
    }

    [Fact]
    public void Apply_sets_unchecked_for_decision_grade_until_scored()
    {
        Finding finding = new()
        {
            Classification = FindingClassification.DecisionGradeFinding,
        };

        FindingSemanticSupportBandDefaultsApplicator.Apply([finding]);

        finding.SemanticSupportBand.Should().Be(FindingSemanticSupportBand.Unchecked);
    }

    [Fact]
    public void Apply_does_not_overwrite_existing_band()
    {
        Finding finding = new()
        {
            Classification = FindingClassification.DecisionGradeFinding,
            SemanticSupportBand = FindingSemanticSupportBand.Supported,
        };

        FindingSemanticSupportBandDefaultsApplicator.Apply([finding]);

        finding.SemanticSupportBand.Should().Be(FindingSemanticSupportBand.Supported);
    }
}
