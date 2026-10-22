using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Findings;
using ArchLucid.Persistence.Serialization;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingsSnapshotJsonFallbackMapperTests
{
    [Fact]
    public void Map_returns_header_only_snapshot_when_findings_json_is_blank()
    {
        FindingsSnapshotStorageRow row = CreateRow(findingsJson: "   ");

        FindingsSnapshot snapshot = FindingsSnapshotJsonFallbackMapper.Map(row);

        snapshot.FindingsSnapshotId.Should().Be(row.FindingsSnapshotId);
        snapshot.RunId.Should().Be(row.RunId);
        snapshot.GenerationStatus.Should().Be(FindingsSnapshotGenerationStatus.Complete);
        snapshot.Findings.Should().BeEmpty();
    }

    [Fact]
    public void Map_prefers_header_columns_over_the_blob_identity_fields()
    {
        FindingsSnapshot blob = new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            CreatedUtc = new DateTime(2020, 1, 1, 0, 0, 0, DateTimeKind.Utc),
            SchemaVersion = 1,
            Findings =
            [
                new Finding
                {
                    FindingId = "f-1",
                    FindingType = "SecurityGap",
                    Category = "Security",
                    EngineType = "Compliance",
                    Severity = FindingSeverity.Warning,
                    Title = "Legacy finding",
                },
            ],
        };

        FindingsSnapshotStorageRow row = CreateRow(JsonEntitySerializer.Serialize(blob));

        FindingsSnapshot snapshot = FindingsSnapshotJsonFallbackMapper.Map(row);

        snapshot.FindingsSnapshotId.Should().Be(row.FindingsSnapshotId);
        snapshot.RunId.Should().Be(row.RunId);
        snapshot.ContextSnapshotId.Should().Be(row.ContextSnapshotId);
        snapshot.GraphSnapshotId.Should().Be(row.GraphSnapshotId);
        snapshot.CreatedUtc.Should().Be(row.CreatedUtc);
        snapshot.SchemaVersion.Should().Be(row.SchemaVersion);
        snapshot.Findings.Should().ContainSingle().Which.Title.Should().Be("Legacy finding");
        snapshot.EngineFailures.Should().NotBeNull();
        snapshot.ChecklistCoverage.Should().NotBeNull();
    }

    [Fact]
    public void Map_rejects_null_row()
    {
        Action act = () => FindingsSnapshotJsonFallbackMapper.Map(null!);

        act.Should().Throw<ArgumentNullException>();
    }

    private static FindingsSnapshotStorageRow CreateRow(string findingsJson) =>
        new()
        {
            FindingsSnapshotId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshotId = Guid.NewGuid(),
            CreatedUtc = new DateTime(2026, 8, 11, 0, 0, 0, DateTimeKind.Utc),
            SchemaVersion = 9,
            GenerationStatus = nameof(FindingsSnapshotGenerationStatus.Complete),
            FindingsJson = findingsJson,
        };
}
