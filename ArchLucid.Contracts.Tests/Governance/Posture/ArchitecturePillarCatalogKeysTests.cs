using ArchLucid.Contracts.Governance.Posture;

namespace ArchLucid.Contracts.Tests.Governance.Posture;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitecturePillarCatalogKeysTests
{
    [Fact]
    public void All_contains_seven_pillar_keys_matching_enum_names()
    {
        string[] expected = Enum.GetNames<ArchitecturePillar>();

        Assert.Equal(expected.Length, ArchitecturePillarCatalogKeys.All.Count);
        Assert.Equal(expected.OrderBy(static x => x), ArchitecturePillarCatalogKeys.All.OrderBy(static x => x));
    }
}
