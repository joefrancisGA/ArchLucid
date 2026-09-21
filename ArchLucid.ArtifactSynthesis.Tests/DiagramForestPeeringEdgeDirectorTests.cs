using ArchLucid.ArtifactSynthesis.Layout;
using ArchLucid.ArtifactSynthesis.Models;

using FluentAssertions;

namespace ArchLucid.ArtifactSynthesis.Tests;

public sealed class DiagramForestPeeringEdgeDirectorTests
{
    [Fact]
    public void ResolveClientToServerEndpoints_orients_proxy_as_server()
    {
        DiagramNode client = new() { NodeId = "client", Label = "vnet-cs-hi-nprd-wus-001" };
        DiagramNode server = new() { NodeId = "server", Label = "vnet-proxy-hi-nprd" };
        DiagramEdge edge = new() { FromNodeId = "server", ToNodeId = "client", Label = "peering" };
        Dictionary<string, DiagramNode> nodesById = new(StringComparer.Ordinal)
        {
            [client.NodeId] = client,
            [server.NodeId] = server,
        };
        List<DiagramNode> component = [client, server];
        List<DiagramEdge> visibleEdges = [edge];

        (string clientNodeId, string serverNodeId) = DiagramForestPeeringEdgeDirector.ResolveClientToServerEndpoints(
            edge,
            component,
            nodesById,
            visibleEdges);

        clientNodeId.Should().Be("client");
        serverNodeId.Should().Be("server");
    }

    [Fact]
    public void ResolveClientToServerEndpoints_orients_hub_as_server_when_no_label_role()
    {
        DiagramNode spoke = new() { NodeId = "spoke", Label = "vnet-east-spoke" };
        DiagramNode hub = new() { NodeId = "hub", Label = "vnet-east-core" };
        DiagramNode otherSpoke = new() { NodeId = "other", Label = "vnet-east-dev" };
        DiagramEdge edge = new() { FromNodeId = "hub", ToNodeId = "spoke", Label = "peering" };
        DiagramEdge hubEdge = new() { FromNodeId = "hub", ToNodeId = "other", Label = "peering" };
        Dictionary<string, DiagramNode> nodesById = new(StringComparer.Ordinal)
        {
            [spoke.NodeId] = spoke,
            [hub.NodeId] = hub,
            [otherSpoke.NodeId] = otherSpoke,
        };
        List<DiagramNode> component = [spoke, hub, otherSpoke];
        List<DiagramEdge> visibleEdges = [edge, hubEdge];

        (string clientNodeId, string serverNodeId) = DiagramForestPeeringEdgeDirector.ResolveClientToServerEndpoints(
            edge,
            component,
            nodesById,
            visibleEdges);

        clientNodeId.Should().Be("spoke");
        serverNodeId.Should().Be("hub");
    }
}
