using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Findings;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Findings;

[Trait("Category", "Unit")]
public sealed class ChecklistCoverageJsonCodecTests
{
    [Fact]
    public void Serialize_returns_null_for_empty_list()
    {
        string? json = ChecklistCoverageJsonCodec.Serialize([]);

        json.Should().BeNull();
    }

    [Fact]
    public void Serialize_and_deserialize_round_trip_finding_rows()
    {
        List<Finding> findings =
        [
            new Finding
            {
                FindingType = "ChecklistCoverage",
                Category = "Security",
                EngineType = "Checklist",
                Severity = FindingSeverity.Warning,
                Title = "Encrypt data at rest",
            },
        ];

        string? json = ChecklistCoverageJsonCodec.Serialize(findings);

        json.Should().NotBeNullOrWhiteSpace();

        List<Finding> roundTrip = ChecklistCoverageJsonCodec.Deserialize(json);

        roundTrip.Should().HaveCount(1);
        roundTrip[0].Title.Should().Be("Encrypt data at rest");
    }

    [Fact]
    public void Deserialize_returns_empty_for_blank_json()
    {
        ChecklistCoverageJsonCodec.Deserialize(null).Should().BeEmpty();
        ChecklistCoverageJsonCodec.Deserialize("   ").Should().BeEmpty();
    }

    [Theory]
    [InlineData("{ not valid json ]")]
    [InlineData("{\"findings\":")]
    public void Deserialize_returns_empty_for_corrupt_json(string corruptJson)
    {
        ChecklistCoverageJsonCodec.Deserialize(corruptJson).Should().BeEmpty();
    }
}
