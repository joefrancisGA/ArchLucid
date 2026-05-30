using System.Text.Json;

using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Common;

[Trait("Category", "Unit")]
public sealed class RuntimePlatformJsonConverterTests
{
    private static readonly JsonSerializerOptions Options = new()
    {
        Converters = { new RuntimePlatformJsonConverter() },
    };

    [Theory]
    [InlineData("\"AppService\"", RuntimePlatform.AppService)]
    [InlineData("\"Azure App Service\"", RuntimePlatform.AppService)]
    [InlineData("\"Azure Cache for Redis\"", RuntimePlatform.Redis)]
    public void Read_maps_enum_and_aliases(string json, RuntimePlatform expected)
    {
        RuntimePlatform value = JsonSerializer.Deserialize<RuntimePlatform>(json, Options);

        value.Should().Be(expected);
    }
}
