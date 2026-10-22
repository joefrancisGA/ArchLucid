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
    public void CoalesceDictionary_maps_null_to_empty_dictionary()
    {
        ContractCollectionDefaults.CoalesceDictionary<string, string>(null).Should().BeEmpty();
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
