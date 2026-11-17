using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class FindingsSnapshotDeserializationTests
{
    [Fact]
    public void Deserialize_null_findings_yields_empty_list_not_null()
    {
        const string json = """
            {
              "findingsSnapshotId": "00000000-0000-0000-0000-000000000001",
              "runId": "00000000-0000-0000-0000-000000000002",
              "contextSnapshotId": "00000000-0000-0000-0000-000000000003",
              "graphSnapshotId": "00000000-0000-0000-0000-000000000004",
              "createdUtc": "2026-10-15T00:00:00Z",
              "findings": null,
              "engineFailures": null,
              "checklistCoverage": null,
              "withheldFindings": null
            }
            """;

        FindingsSnapshot? snapshot =
            JsonSerializer.Deserialize<FindingsSnapshot>(json, ContractJson.CamelCaseCompact);

        snapshot.Should().NotBeNull();
        snapshot!.Findings.Should().NotBeNull().And.BeEmpty();
        snapshot.EngineFailures.Should().NotBeNull().And.BeEmpty();
        snapshot.ChecklistCoverage.Should().NotBeNull().And.BeEmpty();
        snapshot.WithheldFindings.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_explicit_zero_generation_status_yields_complete_not_invalid_zero()
    {
        const string json = """
            {
              "findingsSnapshotId": "00000000-0000-0000-0000-000000000001",
              "runId": "00000000-0000-0000-0000-000000000002",
              "contextSnapshotId": "00000000-0000-0000-0000-000000000003",
              "graphSnapshotId": "00000000-0000-0000-0000-000000000004",
              "createdUtc": "2026-10-15T00:00:00Z",
              "generationStatus": 0,
              "findings": [],
              "engineFailures": [],
              "checklistCoverage": [],
              "withheldFindings": []
            }
            """;

        FindingsSnapshot? snapshot =
            JsonSerializer.Deserialize<FindingsSnapshot>(json, ContractJson.CamelCaseCompact);

        snapshot.Should().NotBeNull();
        snapshot!.GenerationStatus.Should().Be(FindingsSnapshotGenerationStatus.Complete);
    }
}
