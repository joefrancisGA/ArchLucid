using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.Serialization;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingInsightDensityJsonMergerTests
{
    [Fact]
    public void MergeFromFindingsJson_copies_insight_density_fields_by_finding_id()
    {
        Finding relationalFinding = new()
        {
            FindingId = "finding-a",
            FindingSchemaVersion = 1,
            FindingType = "Policy",
            Category = "Security",
            EngineType = "Compliance",
            Severity = FindingSeverity.Warning,
            Title = "Relational title",
            Rationale = "Relational rationale",
        };

        FindingsSnapshot jsonSnapshot = new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            CreatedUtc = DateTime.UtcNow,
            SchemaVersion = 1,
            Findings = [
                new Finding
                {
                    FindingId = "finding-a",
                    FindingSchemaVersion = 1,
                    FindingType = "Policy",
                    Category = "Security",
                    EngineType = "Compliance",
                    Severity = FindingSeverity.Warning,
                    Title = "Json title",
                    Rationale = "Json rationale",
                    InsightDensityScore = 88,
                    Treatment = FindingTreatment.Promote,
                    Classification = FindingClassification.DecisionGradeFinding,
                    WhyThisIsNotGeneric = "Specific blast radius",
                    PrincipalArchitectValue = "Portfolio tradeoff",
                    DecisionConsequence = "Blocks commit",
                },
            ],
        };

        string findingsJson = JsonEntitySerializer.Serialize(jsonSnapshot);
        List<Finding> relationalFindings = [relationalFinding];

        FindingInsightDensityJsonMerger.MergeFromFindingsJson(relationalFindings, findingsJson);

        relationalFinding.InsightDensityScore.Should().Be(88);
        relationalFinding.Treatment.Should().Be(FindingTreatment.Promote);
        relationalFinding.Classification.Should().Be(FindingClassification.DecisionGradeFinding);
        relationalFinding.WhyThisIsNotGeneric.Should().Be("Specific blast radius");
        relationalFinding.PrincipalArchitectValue.Should().Be("Portfolio tradeoff");
        relationalFinding.DecisionConsequence.Should().Be("Blocks commit");
        relationalFinding.Title.Should().Be("Relational title");
    }

    [Fact]
    public void MergeFromFindingsJson_is_noop_when_json_has_no_matching_rows()
    {
        Finding relationalFinding = new()
        {
            FindingId = "finding-a",
            FindingSchemaVersion = 1,
            FindingType = "Policy",
            Category = "Security",
            EngineType = "Compliance",
            Severity = FindingSeverity.Warning,
            Title = "Title",
            Rationale = "Rationale",
        };

        FindingInsightDensityJsonMerger.MergeFromFindingsJson([relationalFinding], "{\"findings\":[]}");

        relationalFinding.InsightDensityScore.Should().BeNull();
        relationalFinding.Treatment.Should().BeNull();
        relationalFinding.Classification.Should().BeNull();
    }
}
