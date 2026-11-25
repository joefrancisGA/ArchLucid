using ArchLucid.Contracts.Serialization;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests.Serialization;

[Trait("Category", "Unit")]
public sealed class ContractCollectionDefaultsTests
{
    [Fact]
    public void Coalesce_maps_null_to_empty_list()
    {
        ContractCollectionDefaults.Coalesce<string>(null).Should().BeEmpty();
    }

    [Fact]
    public void CoalesceReadOnly_maps_null_to_empty_list()
    {
        ContractCollectionDefaults.CoalesceReadOnly<int>(null).Should().BeEmpty();
    }

    [Fact]
    public void CoalesceArray_preserves_order_of_populated_array()
    {
        byte[] original = [17, 3, 81];

        ContractCollectionDefaults.CoalesceArray(original).Should().Equal((byte)17, (byte)3, (byte)81);
    }

    [Fact]
    public void CoalesceDictionary_maps_null_to_empty_dictionary()
    {
        ContractCollectionDefaults.CoalesceDictionary<string, string>(null).Should().BeEmpty();
    }

    [Fact]
    public void CoalesceDictionary_preserves_all_populated_entries()
    {
        Dictionary<string, string> metadata = new()
        {
            ["format"] = "markdown",
            ["generator"] = "diagram",
        };

        Dictionary<string, string> result = ContractCollectionDefaults.CoalesceDictionary(metadata);

        result.Should().HaveCount(2);
        result.Should().Contain("format", "markdown");
        result.Should().Contain("generator", "diagram");
    }

    [Fact]
    public void CoalesceStringDictionaryOrdinal_keeps_case_distinct_keys_after_null()
    {
        Dictionary<string, string> properties = ContractCollectionDefaults.CoalesceStringDictionaryOrdinal(null);

        properties.Should().BeEmpty();
        properties["Owner"] = "platform";
        properties["owner"] = "application";

        properties.Should().HaveCount(2);
        properties["Owner"].Should().Be("platform");
        properties["owner"].Should().Be("application");
    }

    [Fact]
    public void CoalesceStringDictionaryOrdinalIgnoreCase_maps_null_to_empty_case_insensitive_dictionary()
    {
        Dictionary<string, string> metadata = ContractCollectionDefaults.CoalesceStringDictionaryOrdinalIgnoreCase(null);

        metadata.Should().BeEmpty();
        metadata["AgentType"] = "topology";
        metadata.Should().ContainKey("agenttype");
    }

    [Fact]
    public void CoalesceRequired_maps_null_to_empty_string()
    {
        ContractCollectionDefaults.CoalesceRequired(null).Should().BeEmpty();
        ContractCollectionDefaults.CoalesceRequired("x").Should().Be("x");
    }
}
