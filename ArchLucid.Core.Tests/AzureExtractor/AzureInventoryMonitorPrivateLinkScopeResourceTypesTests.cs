using ArchLucid.Core.AzureExtractor;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryMonitorPrivateLinkScopeResourceTypesTests
{
    [Fact]
    public void TryParseScopeIdFromScopedResourceId_returns_scope_id()
    {
        const string scopeId =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Insights/privateLinkScopes/extension-pls";
        const string scopedResourceId = $"{scopeId}/scopedResources/appinsights-1";

        bool parsed = AzureInventoryMonitorPrivateLinkScopeResourceTypes.TryParseScopeIdFromScopedResourceId(
            scopedResourceId,
            out string? parsedScopeId);

        parsed.Should().BeTrue();
        parsedScopeId.Should().BeEquivalentTo(scopeId);
    }

    [Theory]
    [InlineData("Microsoft.Insights/privateLinkScopes", true)]
    [InlineData(
        "Microsoft.Insights/privateLinkScopes/extension-pls/scopedResources/appinsights-1",
        false)]
    public void IsScopeResourceType_matches_parent_only(string armType, bool expected)
    {
        AzureInventoryMonitorPrivateLinkScopeResourceTypes.IsScopeResourceType(armType).Should().Be(expected);
    }

    [Theory]
    [InlineData(
        "Microsoft.Insights/privateLinkScopes/extension-pls/scopedResources/appinsights-1",
        true)]
    [InlineData("Microsoft.Insights/privateLinkScopes", false)]
    public void IsDiagramOmitChildType_matches_scoped_resource_children(string armType, bool expected)
    {
        AzureInventoryMonitorPrivateLinkScopeResourceTypes.IsDiagramOmitChildType(armType).Should().Be(expected);
    }
}
