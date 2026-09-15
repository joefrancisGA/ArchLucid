using ArchLucid.ArtifactSynthesis.Layout;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramArmTypeFriendlyNameTests
{
    [Theory]
    [InlineData("Microsoft.Compute/virtualMachines", "Virtual machine")]
    [InlineData("Microsoft.Sql/servers/databases", "SQL database")]
    [InlineData("Microsoft.Network/virtualNetworks", "Virtual network")]
    [InlineData("Microsoft.Network/networkInterfaces", "Network interface")]
    [InlineData("Microsoft.Storage/storageAccounts", "Storage account")]
    [InlineData("Microsoft.DataFactory/factories", "Data factory")]
    public void TryFormat_maps_known_arm_types(string armType, string expected)
    {
        DiagramArmTypeFriendlyName.TryFormat(armType).Should().Be(expected);
    }

    [Fact]
    public void TryFormat_splits_unknown_camel_case_segments()
    {
        DiagramArmTypeFriendlyName.TryFormat("Microsoft.Example/widgetFarms")
            .Should()
            .Be("Widget farms");
    }

    [Fact]
    public void TryFormat_returns_null_for_blank()
    {
        DiagramArmTypeFriendlyName.TryFormat(null).Should().BeNull();
        DiagramArmTypeFriendlyName.TryFormat("  ").Should().BeNull();
    }
}
