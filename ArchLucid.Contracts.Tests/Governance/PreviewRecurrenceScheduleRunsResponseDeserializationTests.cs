using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class PreviewRecurrenceScheduleRunsResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_next_run_utc_yields_empty_list_not_null()
    {
        const string json = """
            {
              "isValid": true,
              "nextRunUtc": null
            }
            """;

        PreviewRecurrenceScheduleRunsResponse response =
            JsonSerializer.Deserialize<PreviewRecurrenceScheduleRunsResponse>(json, ContractJson.CamelCaseCompact)!;

        response.NextRunUtc.Should().NotBeNull().And.BeEmpty();
    }
}
