using System.Text.Json;

using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Common;

[Trait("Category", "Unit")]
public sealed class AgentTypeJsonConverterTests
{
    private static readonly JsonSerializerOptions Options = new()
    {
        Converters = { new AgentTypeJsonConverter() }
    };

    [Fact]
    public void Read_maps_dispatch_key_topology()
    {
        AgentType value = JsonSerializer.Deserialize<AgentType>("\"topology\"", Options);

        value.Should().Be(AgentType.Topology);
    }

    [Fact]
    public void Read_maps_enum_name_case_insensitive()
    {
        AgentType value = JsonSerializer.Deserialize<AgentType>("\"Compliance\"", Options);

        value.Should().Be(AgentType.Compliance);
    }
}
