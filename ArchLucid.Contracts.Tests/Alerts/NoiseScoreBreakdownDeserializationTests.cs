using System.Text.Json;

using ArchLucid.Contracts.Alerts.Tuning;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Alerts;

[Trait("Category", "Unit")]
public sealed class NoiseScoreBreakdownDeserializationTests
{
    [Fact]
    public void Deserialize_null_notes_yields_empty_list_not_null()
    {
        const string json = """
            {
              "notes": null
            }
            """;

        NoiseScoreBreakdown? result =
            JsonSerializer.Deserialize<NoiseScoreBreakdown>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Notes.Should().NotBeNull().And.BeEmpty();
    }
}
