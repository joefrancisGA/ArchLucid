using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Pilots;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Pilots;

[Trait("Category", "Unit")]
public sealed class ExplainabilityTraceCompletenessPackDeserializationTests
{
    [Fact]
    public void Deserialize_null_by_engine_yields_empty_list_not_null()
    {
        const string json = """
            {
              "byEngine": null
            }
            """;

        ExplainabilityTraceCompletenessPack? result =
            JsonSerializer.Deserialize<ExplainabilityTraceCompletenessPack>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.ByEngine.Should().NotBeNull().And.BeEmpty();
    }
}
