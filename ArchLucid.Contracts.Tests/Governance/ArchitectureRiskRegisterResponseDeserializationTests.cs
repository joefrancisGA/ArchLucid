using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class ArchitectureRiskRegisterResponseDeserializationTests
{
    [Fact]
    public void Deserialize_null_entries_yields_empty_list_not_null()
    {
        const string json = """
            {
              "entries": null
            }
            """;

        ArchitectureRiskRegisterResponse response =
            JsonSerializer.Deserialize<ArchitectureRiskRegisterResponse>(json, ContractJson.Default)!;

        response.Entries.Should().NotBeNull().And.BeEmpty();
    }
}
