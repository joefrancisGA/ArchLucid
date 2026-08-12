using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.Serialization;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingsCoverageProjectionMapperTests
{
    [Fact]
    public void Map_projects_header_scalars_and_finding_metadata()
    {
        FindingsCoverageHeaderRow header = CreateHeader();

        FindingsCoverageFindingRow[] rows =
        [
            new()
            {
                FindingId = "f-1",
                FindingType = "SecurityGap",
                Category = "Security",
                EngineType = "Compliance",
                Severity = "Critical",
                Title = "Public storage account",
                PolicyRuleId = "  rule-1  ",
            },
        ];

        FindingsSnapshot snapshot = FindingsCoverageProjectionMapper.Map(header, rows);

        snapshot.FindingsSnapshotId.Should().Be(header.FindingsSnapshotId);
        snapshot.RunId.Should().Be(header.RunId);
        snapshot.SchemaVersion.Should().Be(7);
        snapshot.EvaluationConfidenceEnrichmentSkipped.Should().BeTrue();
        snapshot.Findings.Should().HaveCount(1);
        snapshot.Findings[0].Severity.Should().Be(FindingSeverity.Critical);
        snapshot.Findings[0].PolicyRuleId.Should().Be("rule-1");
        snapshot.Findings[0].Rationale.Should().BeEmpty();
    }

    [Fact]
    public void Map_defaults_unknown_severity_to_info_and_blank_policy_rule_to_null()
    {
        FindingsCoverageFindingRow[] rows =
        [
            new()
            {
                FindingId = "f-1",
                FindingType = "SecurityGap",
                Category = "Security",
                EngineType = "Compliance",
                Severity = "NotASeverity",
                Title = "Unknown severity",
                PolicyRuleId = "   ",
            },
        ];

        FindingsSnapshot snapshot = FindingsCoverageProjectionMapper.Map(CreateHeader(), rows);

        snapshot.Findings[0].Severity.Should().Be(FindingSeverity.Info);
        snapshot.Findings[0].PolicyRuleId.Should().BeNull();
    }

    [Fact]
    public void Map_defaults_enrichment_skipped_to_false_when_column_is_null()
    {
        FindingsSnapshot snapshot = FindingsCoverageProjectionMapper.Map(
            new FindingsCoverageHeaderRow
            {
                FindingsSnapshotId = Guid.NewGuid(),
                RunId = Guid.NewGuid(),
                SchemaVersion = 7,
                EvaluationConfidenceEnrichmentSkipped = null,
            },
            []);

        snapshot.EvaluationConfidenceEnrichmentSkipped.Should().BeFalse();
        snapshot.Findings.Should().BeEmpty();
    }

    [Fact]
    public void Map_rejects_null_arguments()
    {
        Action nullHeader = () => FindingsCoverageProjectionMapper.Map(null!, []);
        Action nullRows = () => FindingsCoverageProjectionMapper.Map(CreateHeader(), null!);

        nullHeader.Should().Throw<ArgumentNullException>();
        nullRows.Should().Throw<ArgumentNullException>();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("   ")]
    [InlineData("[{ not valid json")]
    public void TryDeserializeEngineFailures_returns_empty_for_missing_or_corrupt_json(string? json)
    {
        FindingsCoverageProjectionMapper.TryDeserializeEngineFailures(json).Should().BeEmpty();
    }

    [Fact]
    public void TryDeserializeEngineFailures_reads_engine_failure_array()
    {
        List<FindingEngineFailure> source =
        [
            new()
            {
                EngineType = "Compliance",
                Category = "Compliance",
                ErrorMessage = "engine timed out",
                ExceptionType = nameof(TimeoutException),
                DurationMs = 12,
                OccurredUtc = new DateTime(2026, 8, 11, 0, 0, 0, DateTimeKind.Utc),
            },
        ];

        List<FindingEngineFailure> failures = FindingsCoverageProjectionMapper.TryDeserializeEngineFailures(
            JsonEntitySerializer.Serialize(source));

        failures.Should().HaveCount(1);
        failures[0].EngineType.Should().Be("Compliance");
        failures[0].ErrorMessage.Should().Be("engine timed out");
    }

    private static FindingsCoverageHeaderRow CreateHeader() =>
        new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            CreatedUtc = new DateTime(2026, 8, 11, 0, 0, 0, DateTimeKind.Utc),
            SchemaVersion = 7,
            GenerationStatus = nameof(FindingsSnapshotGenerationStatus.Complete),
            EvaluationConfidenceEnrichmentSkipped = true,
        };
}
