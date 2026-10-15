using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Context;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Persistence.Context;

[Trait("Category", "Unit")]
public sealed class ContextSnapshotDeserializationTests
{
    [Fact]
    public void Deserialize_null_list_and_dictionary_properties_yield_empty_collections_not_null()
    {
        const string json = """
            {
              "canonicalObjects": null,
              "warnings": null,
              "errors": null,
              "sourceHashes": null
            }
            """;

        ContextSnapshot? result =
            JsonSerializer.Deserialize<ContextSnapshot>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.CanonicalObjects.Should().NotBeNull().And.BeEmpty();
        result.Warnings.Should().NotBeNull().And.BeEmpty();
        result.Errors.Should().NotBeNull().And.BeEmpty();
        result.SourceHashes.Should().NotBeNull().And.BeEmpty();
    }
}
