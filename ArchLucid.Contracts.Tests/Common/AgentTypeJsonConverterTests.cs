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

    [Fact]
    public void Read_maps_defined_integer_values()
    {
        JsonSerializer.Deserialize<AgentType>("1", Options).Should().Be(AgentType.Topology);
        JsonSerializer.Deserialize<AgentType>("4", Options).Should().Be(AgentType.Critic);
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<AgentType>("99", Options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown agent type value*");
    }

    [Fact]
    public void Read_blank_or_unknown_string_throws()
    {
        Action blank = () => JsonSerializer.Deserialize<AgentType>("\"\"", Options);
        Action unknown = () => JsonSerializer.Deserialize<AgentType>("\"not-an-agent\"", Options);

        blank.Should().Throw<JsonException>();
        unknown.Should().Throw<JsonException>()
            .WithMessage("*Unknown agent type value*");
    }
}
