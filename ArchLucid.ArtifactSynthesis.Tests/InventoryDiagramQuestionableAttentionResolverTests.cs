using ArchLucid.ArtifactSynthesis.Compilers;
using ArchLucid.Contracts.Persistence.Graph;
using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

[Trait("Category", "Unit")]
public sealed class InventoryDiagramQuestionableAttentionResolverTests
{
    [Fact]
    public void Marks_avd_named_vm_when_other_session_hosts_exist_but_vm_is_not_registered()
    {
        GraphNode vm = Node(
            "avd-vm",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/avd01-nprod-0",
            "Microsoft.Compute/virtualMachines");
        GraphNode registeredHost = Node(
            "host",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DesktopVirtualization/hostPools/pool/sessionHosts/other.contoso.com",
            "Microsoft.DesktopVirtualization/hostPools/sessionHosts");
        GraphSnapshot graph = Snapshot(vm, registeredHost);

        var result = InventoryDiagramQuestionableAttentionResolver.Resolve(
            graph,
            [InventoryDiagramQuestionableAttentionResolver.UhgUnregisteredAvdSessionHostRuleKey]);

        result.Should().ContainKey("avd-vm");
        result["avd-vm"].Reason.Should().Contain("not listed");
    }

    [Fact]
    public void Does_not_mark_vm_when_session_host_name_or_resource_id_matches()
    {
        GraphNode vm = Node(
            "avd-vm",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/avd01-nprod-0",
            "Microsoft.Compute/virtualMachines");
        GraphNode nameMatch = Node(
            "host-name",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DesktopVirtualization/hostPools/pool/sessionHosts/avd01-nprod-0.contoso.com",
            "Microsoft.DesktopVirtualization/hostPools/sessionHosts");
        GraphNode idMatch = Node(
            "host-id",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DesktopVirtualization/hostPools/pool/sessionHosts/other",
            "Microsoft.DesktopVirtualization/hostPools/sessionHosts");
        idMatch.Properties["properties.resourceId"] = vm.Properties["arm.id"];

        var result = InventoryDiagramQuestionableAttentionResolver.Resolve(
            Snapshot(vm, nameMatch, idMatch),
            [InventoryDiagramQuestionableAttentionResolver.UhgUnregisteredAvdSessionHostRuleKey]);

        result.Should().BeEmpty();
    }

    [Fact]
    public void Marks_avd_prefix_vms_when_no_session_hosts_were_collected()
    {
        GraphNode vm = Node(
            "avd-vm",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/avd01-nprod-0",
            "Microsoft.Compute/virtualMachines");

        var result = InventoryDiagramQuestionableAttentionResolver.Resolve(
            Snapshot(vm),
            [InventoryDiagramQuestionableAttentionResolver.UhgUnregisteredAvdSessionHostRuleKey]);

        result.Should().ContainKey("avd-vm");
        result["avd-vm"].Reason.Should().Contain("No session hosts were collected");
    }

    [Fact]
    public void Does_not_mark_without_rule_key()
    {
        GraphNode vm = Node(
            "avd-vm",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/avd01-nprod-0",
            "Microsoft.Compute/virtualMachines");

        InventoryDiagramQuestionableAttentionResolver.Resolve(Snapshot(vm), []).Should().BeEmpty();
    }

    [Fact]
    public void Does_not_mark_non_avd_vms_when_session_hosts_absent()
    {
        GraphNode web = Node(
            "web01",
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/web01",
            "Microsoft.Compute/virtualMachines");

        InventoryDiagramQuestionableAttentionResolver.Resolve(
            Snapshot(web),
            [InventoryDiagramQuestionableAttentionResolver.UhgUnregisteredAvdSessionHostRuleKey]).Should().BeEmpty();
    }

    private static GraphSnapshot Snapshot(params GraphNode[] nodes) => new() { Nodes = [.. nodes] };

    private static GraphNode Node(string nodeId, string armId, string armType) => new()
    {
        NodeId = nodeId,
        Label = nodeId,
        Properties = new Dictionary<string, string>
        {
            ["arm.id"] = armId,
            ["arm.type"] = armType,
        },
    };
}
