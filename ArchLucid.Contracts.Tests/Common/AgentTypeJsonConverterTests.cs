using System.Text.Json;

using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Common;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
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
    public void Read_maps_whole_number_double_ordinal()
    {
        JsonSerializer.Deserialize<AgentType>("1.0", Options).Should().Be(AgentType.Topology);
    }

    [Fact]
    public void Read_integer_out_of_range_throws()
    {
        Action act = () => JsonSerializer.Deserialize<AgentType>("99", Options);

        act.Should().Throw<JsonException>()
            .WithMessage("*Unknown agent type value*");
    }

    [Fact]
    public void Write_coerces_unset_default_to_topology_key()
    {
        string json = JsonSerializer.Serialize(default(AgentType), Options);

        json.Should().Be("\"topology\"");
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

    [Fact]
    public void Write_default_agent_type_persists_topology_dispatch_key()
    {
        string json = JsonSerializer.Serialize(default(AgentType), Options);

        json.Should().Be("\"topology\"");
    }

    [Fact]
    public void Write_undefined_non_default_ordinal_throws()
    {
        Action act = () => JsonSerializer.Serialize((AgentType)99, Options);

        act.Should().Throw<ArgumentOutOfRangeException>()
            .WithParameterName("agentType");
    }
}
