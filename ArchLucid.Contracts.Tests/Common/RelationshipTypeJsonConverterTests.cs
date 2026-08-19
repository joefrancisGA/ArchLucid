using System.Text.Json;

using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Common;

[Trait("Category", "Unit")]
public sealed class RelationshipTypeJsonConverterTests
{
    private static readonly JsonSerializerOptions Options = new()
    {
        Converters = { new RelationshipTypeJsonConverter() },
    };

    [Theory]
    [InlineData("\"ReadsFrom\"", RelationshipType.ReadsFrom)]
    [InlineData("\"reads from\"", RelationshipType.ReadsFrom)]
    [InlineData("\"depends on\"", RelationshipType.Calls)]
    public void Read_maps_enum_and_aliases(string json, RelationshipType expected)
    {
        RelationshipType value = JsonSerializer.Deserialize<RelationshipType>(json, Options);

        value.Should().Be(expected);
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<RelationshipType>("99", Options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown relationship type value*");
    }
}
