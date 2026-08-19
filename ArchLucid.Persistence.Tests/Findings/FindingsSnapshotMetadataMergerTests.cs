using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.Serialization;

namespace ArchLucid.Persistence.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class FindingsSnapshotMetadataMergerTests
{
    [Fact]
    public void MergeFromFindingsJson_throws_for_null_snapshot()
    {
        Action act = () => FindingsSnapshotMetadataMerger.MergeFromFindingsJson(null!, findingsJson: null);

        act.Should().Throw<ArgumentNullException>();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void MergeFromFindingsJson_is_noop_when_json_is_missing(string? findingsJson)
    {
        FindingsSnapshot snapshot = new()
        {
            GenerationStatus = FindingsSnapshotGenerationStatus.Complete,
            EvaluationConfidenceEnrichmentSkipped = true,
        };

        FindingsSnapshotMetadataMerger.MergeFromFindingsJson(snapshot, findingsJson);

        snapshot.GenerationStatus.Should().Be(FindingsSnapshotGenerationStatus.Complete);
        snapshot.EvaluationConfidenceEnrichmentSkipped.Should().BeTrue();
    }

    [Fact]
    public void MergeFromFindingsJson_overlays_header_fields_from_json()
    {
        FindingsSnapshot header = new()
        {
            GenerationStatus = FindingsSnapshotGenerationStatus.PartiallyComplete,
            EvaluationConfidenceEnrichmentSkipped = true,
            EngineFailures =
            [
                new FindingEngineFailure
                {
                    EngineType = "Cost",
                    Category = "Cost",
                    ErrorMessage = "boom",
                    ExceptionType = nameof(InvalidOperationException),
                },
            ],
            ChecklistCoverage = [new Finding { Category = "Hygiene", FindingType = "Tagging" }],
        };

        string json = JsonEntitySerializer.Serialize(header);

        FindingsSnapshot snapshot = new()
        {
            GenerationStatus = FindingsSnapshotGenerationStatus.Complete,
            EvaluationConfidenceEnrichmentSkipped = false,
        };

        FindingsSnapshotMetadataMerger.MergeFromFindingsJson(snapshot, json);

        snapshot.GenerationStatus.Should().Be(FindingsSnapshotGenerationStatus.PartiallyComplete);
        snapshot.EvaluationConfidenceEnrichmentSkipped.Should().BeTrue();
        snapshot.EngineFailures.Should().ContainSingle(f => f.EngineType == "Cost");
        snapshot.ChecklistCoverage.Should().ContainSingle(f => f.FindingType == "Tagging");
    }

    [Fact]
    public void MergeFromFindingsJson_coerces_null_engine_failures_and_checklist_to_empty()
    {
        FindingsSnapshot snapshot = new()
        {
            EngineFailures =
            [
                new FindingEngineFailure
                {
                    EngineType = "Security",
                    Category = "Security",
                    ErrorMessage = "prior",
                    ExceptionType = nameof(InvalidOperationException),
                },
            ],
            ChecklistCoverage = [new Finding { Category = "Prior", FindingType = "Prior" }],
        };

        // Entity JSON uses numeric enums (no JsonStringEnumConverter on EntityJsonOptions).
        FindingsSnapshotMetadataMerger.MergeFromFindingsJson(
            snapshot,
            """{"engineFailures":null,"checklistCoverage":null,"generationStatus":2}""");

        snapshot.EngineFailures.Should().BeEmpty();
        snapshot.ChecklistCoverage.Should().BeEmpty();
        snapshot.GenerationStatus.Should().Be(FindingsSnapshotGenerationStatus.Complete);
    }
}
