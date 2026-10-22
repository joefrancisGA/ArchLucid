using ArchLucid.Application.Findings.HeldCheck;
using ArchLucid.Contracts.Common;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings.HeldCheck;

[Trait("Category", "Unit")]
public sealed class HeldCheckSecondPassInputCodeMapperTests
{
    [Theory]
    [InlineData(CloudProvider.Aws, HeldCheckInputCode.AwsInventoryZip)]
    [InlineData(CloudProvider.Gcp, HeldCheckInputCode.GcpInventoryZip)]
    public void FromCloudProvider_maps_inventory_codes(CloudProvider provider, HeldCheckInputCode expected)
    {
        HeldCheckSecondPassInputCodeMapper.FromCloudProvider(provider).Should().Be(expected);
    }
}
