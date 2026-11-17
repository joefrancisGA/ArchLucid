using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingMergeConflictTriageRetentionTests
{
    [Fact]
    public void Apply_restores_merge_conflict_rows_demoted_for_empty_related_nodes()
    {
        Finding conflict = new()
        {
            FindingId = "conflict-1",
            FindingType = FindingMergeConflictPresenter.FindingType,
            Category = "Security",
            Classification = FindingClassification.ChecklistCoverage,
            Treatment = FindingTreatment.DemoteToChecklist,
            RelatedNodeIds = [],
        };
        Finding architecture = new()
        {
            FindingId = "finding-alpha",
            FindingType = "T",
            Category = "Security",
            Classification = FindingClassification.ChecklistCoverage,
            Treatment = FindingTreatment.DemoteToChecklist,
        };

        FindingMergeConflictTriageRetention.Apply([conflict, architecture]);

        conflict.Classification.Should().Be(FindingClassification.DecisionGradeFinding);
        conflict.Treatment.Should().Be(FindingTreatment.Promote);
        architecture.Classification.Should().Be(FindingClassification.ChecklistCoverage);
        architecture.Treatment.Should().Be(FindingTreatment.DemoteToChecklist);
    }

    [Fact]
    public void Apply_throws_when_findings_are_null()
    {
        Action act = () => FindingMergeConflictTriageRetention.Apply(null!);

        act.Should().Throw<ArgumentNullException>();
    }
}
