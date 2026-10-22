using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Requests;

[Trait("Category", "Unit")]
public sealed class DraftArchitectureRequestInputDeserializationTests
{
    [Fact]
    public void Deserialize_null_string_array_properties_yields_empty_arrays_not_null()
    {
        const string json = """
            {
              "freeTextDescription": "abcdefghijklmnopqrst",
              "currentConstraints": null,
              "currentAssumptions": null,
              "confirmedAssumptions": null
            }
            """;

        DraftArchitectureRequestInput? input =
            JsonSerializer.Deserialize<DraftArchitectureRequestInput>(json, ContractJson.CamelCaseCompact);

        input.Should().NotBeNull();
        input!.CurrentConstraints.Should().NotBeNull().And.BeEmpty();
        input.CurrentAssumptions.Should().NotBeNull().And.BeEmpty();
        input.ConfirmedAssumptions.Should().NotBeNull().And.BeEmpty();
    }
}
