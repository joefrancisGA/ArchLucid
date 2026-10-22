using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class FeasibilityHardCitationDeserializationTests
{
    [Fact]
    public void Deserialize_null_invariant_keys_yields_empty_list_not_null()
    {
        const string json = """
            {
              "kind": 0,
              "reference": "CAP theorem",
              "invariantKeys": null
            }
            """;

        FeasibilityHardCitation citation =
            JsonSerializer.Deserialize<FeasibilityHardCitation>(json, ContractJson.Default)!;

        citation.InvariantKeys.Should().NotBeNull().And.BeEmpty();
    }
}
