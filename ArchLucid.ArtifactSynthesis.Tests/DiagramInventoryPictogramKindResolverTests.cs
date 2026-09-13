using ArchLucid.ArtifactSynthesis.Layout;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramInventoryPictogramKindResolverTests
{
    [Theory]
    [InlineData("Microsoft.Compute/virtualMachines", DiagramInventoryPictogramKind.Compute)]
    [InlineData("Microsoft.Network/virtualNetworks", DiagramInventoryPictogramKind.Network)]
    [InlineData("Microsoft.Sql/servers/databases", DiagramInventoryPictogramKind.Data)]
    [InlineData("Microsoft.Storage/storageAccounts", DiagramInventoryPictogramKind.Storage)]
    [InlineData(null, DiagramInventoryPictogramKind.Generic)]
    public void Resolve_maps_arm_type_to_pictogram(string? armType, DiagramInventoryPictogramKind expected)
    {
        DiagramInventoryPictogramKindResolver.Resolve(armType).Should().Be(expected);
    }
}
