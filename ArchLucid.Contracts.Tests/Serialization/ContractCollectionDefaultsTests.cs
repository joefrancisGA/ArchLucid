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
}
