using System.Text.Json;

using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Common;

[Trait("Category", "Unit")]
public sealed class DatastoreTypeJsonConverterTests
{
    private static readonly JsonSerializerOptions Options = new()
    {
        Converters = { new DatastoreTypeJsonConverter() },
    };

    [Theory]
    [InlineData("\"Sql\"", DatastoreType.Sql)]
    [InlineData("\"Redis\"", DatastoreType.Cache)]
    [InlineData("\"Azure SQL Database\"", DatastoreType.Sql)]
    public void Read_maps_enum_and_aliases(string json, DatastoreType expected)
    {
        DatastoreType value = JsonSerializer.Deserialize<DatastoreType>(json, Options);

        value.Should().Be(expected);
    }
}
