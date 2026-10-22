using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class ArchitectureSealDeltaResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_diffs_yields_empty_list_not_null()
    {
        const string json = """
            {
              "diffs": null
            }
            """;

        ArchitectureSealDeltaResponse? result =
            JsonSerializer.Deserialize<ArchitectureSealDeltaResponse>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Diffs.Should().NotBeNull().And.BeEmpty();
    }
}
