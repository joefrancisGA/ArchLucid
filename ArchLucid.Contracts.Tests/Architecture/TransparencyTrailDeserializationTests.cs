using System.Text.Json;

using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Architecture;

[Trait("Category", "Unit")]
public sealed class TransparencyTrailDeserializationTests
{
    [Fact]
    public void Deserialize_null_collection_properties_yields_empty_lists_not_null()
    {
        const string json = """
            {
              "asserted": null,
              "inferred": null,
              "skipped": null
            }
            """;

        TransparencyTrail trail = JsonSerializer.Deserialize<TransparencyTrail>(json, ContractJson.Default)!;

        trail.Asserted.Should().NotBeNull().And.BeEmpty();
        trail.Inferred.Should().NotBeNull().And.BeEmpty();
        trail.Skipped.Should().NotBeNull().And.BeEmpty();
    }
}
