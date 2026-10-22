using System.Text.Json;

using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;

using FluentAssertions;

namespace ArchLucid.Core.Tests.AzureExtractor;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AzureInventoryFabricCapacityWorkspaceParserTests
{
    [Fact]
    public void TryReadWorkspaceAssignment_returns_arm_workspace_id()
    {
        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "id": "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Fabric/workspaces/ws1",
              "name": "ws1"
            }
            """);

        bool parsed = AzureInventoryFabricCapacityWorkspaceParser.TryReadWorkspaceAssignment(
            document.RootElement,
            out string? workspaceResourceId,
            out string? workspaceDisplayName);

        parsed.Should().BeTrue();
        workspaceResourceId.Should().Be(
            ArmResourceIdNormalizer.Normalize(
                "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Fabric/workspaces/ws1"));
        workspaceDisplayName.Should().Be("ws1");
    }

    [Fact]
    public void TryReadWorkspaceAssignment_returns_false_for_non_arm_id()
    {
        using JsonDocument document = JsonDocument.Parse(
            """
            {
              "id": "workspace-guid-only",
              "displayName": "Outside inventory"
            }
            """);

        bool parsed = AzureInventoryFabricCapacityWorkspaceParser.TryReadWorkspaceAssignment(
            document.RootElement,
            out string? workspaceResourceId,
            out string? workspaceDisplayName);

        parsed.Should().BeFalse();
        workspaceResourceId.Should().BeNull();
        workspaceDisplayName.Should().Be("Outside inventory");
    }
}
