using System.Text.Json;

using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Context;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Persistence.Context;

[Trait("Category", "Unit")]
public sealed class CanonicalObjectDeserializationTests
{
    [Fact]
    public void Deserialize_null_name_yields_empty_string_not_null()
    {
        const string json = """
            {
              "objectType": "service",
              "name": null,
              "sourceType": "arm",
              "sourceId": "/subscriptions/x"
            }
            """;

        CanonicalObject? result =
            JsonSerializer.Deserialize<CanonicalObject>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Name.Should().BeEmpty();
    }

    [Fact]
    public void Deserialize_null_properties_yields_empty_dictionary_not_null()
    {
        const string json = """
            {
              "objectType": "service",
              "name": "api",
              "sourceType": "arm",
              "sourceId": "/subscriptions/x",
              "properties": null
            }
            """;

        CanonicalObject? result =
            JsonSerializer.Deserialize<CanonicalObject>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.Properties.Should().NotBeNull().And.BeEmpty();
    }

    [Fact]
    public void Deserialize_null_identity_columns_yield_empty_strings_not_null()
    {
        const string json = """
            {
              "objectType": null,
              "name": "api",
              "sourceType": null,
              "sourceId": null
            }
            """;

        CanonicalObject? result =
            JsonSerializer.Deserialize<CanonicalObject>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.ObjectType.Should().BeEmpty();
        result.SourceType.Should().BeEmpty();
        result.SourceId.Should().BeEmpty();
    }
    [Fact]
    public void Deserialize_null_object_id_yields_empty_string_not_null()
    {
        const string json = """
            {
              "objectId": null,
              "objectType": "service",
              "name": "api",
              "sourceType": "arm",
              "sourceId": "/x"
            }
            """;

        CanonicalObject? result =
            JsonSerializer.Deserialize<CanonicalObject>(json, ContractJson.CamelCaseCompact);

        result.Should().NotBeNull();
        result!.ObjectId.Should().BeEmpty();
    }
}