using ArchLucid.Application.InfraEvidence.OperationalSecurityFindings;
using ArchLucid.Application.InfraEvidence.SecureNowArchitect;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.Core.Scoping;
using ArchLucid.Decisioning.Interfaces;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.InfraEvidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class IntendedReachabilityEngineTests
{
    private static readonly Guid TenantId = Guid.Parse("a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1");
    private static readonly Guid WorkspaceId = Guid.Parse("b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2");
    private static readonly Guid ProjectId = Guid.Parse("c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3");
    private static readonly Guid SnapshotId = Guid.Parse("d4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4");

    private const string PublicIpArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/pip1";
    private const string NicArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/networkInterfaces/nic1";
    private const string SubnetArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1/subnets/app";
    private const string StorageArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Storage/storageAccounts/sa1";
    private const string SqlArm =
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Sql/servers/sql1";

    [Fact]
    public async Task RunAsync_public_ip_and_nsg_allow_produces_highly_likely_reachability_path()
    {
        ScopeContext scope = CreateScope();
        AzureInventorySnapshotDetailReadModel snapshot = BuildPublicStoragePathSnapshot(includeNsgRoute: true);

        InMemorySecurityEvidencePathRepository pathRepository = new();
        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        IntendedReachabilityEngine sut = CreateEngine(snapshot, scope, pathRepository, findingRepository);

        PrivilegePathEngineResult result = await sut.RunAsync(
            scope,
            SnapshotId,
            SecureNowArchitectConstants.SystemActorId,
            CancellationToken.None);

        result.Succeeded.Should().BeTrue();
        result.PathsDiscovered.Should().BeGreaterThan(0);

        SecurityEvidencePathRecord path = pathRepository.StoredPaths.Should().ContainSingle().Subject;
        path.PathKind.Should().Be(PathKind.IntendedReachability);
        path.PathConfidenceBand.Should().BeOneOf(PathConfidenceBand.HighlyLikely, PathConfidenceBand.Possible);

        OperationalSecurityFindingRecord finding = findingRepository.StoredFindings.Should().ContainSingle().Subject;
        finding.PathId.Should().NotBeNull();
        finding.Title.Should().StartWith("Intended reachability:");
        finding.Description.Should().Contain("Intended control-plane path");
        finding.Description.Should().NotContain("traffic is flowing");

        IReadOnlyList<SecurityEvidencePathHopRecord> hops =
            await pathRepository.ListHopsByPathAsync(TenantId, path.PathId, CancellationToken.None);

        hops.Should().Contain(hop =>
            hop.EdgeType == GraphEdgeTypes.RoutesTo
            && hop.ProvenanceKind == ProvenanceKind.DeterministicInference);
        hops.Should().NotContain(hop =>
            hop.EdgeType == SecureNowArchitectConstants.InsufficientEvidenceNsgHopEdgeType);
    }

    [Fact]
    public void Enumerate_subnet_without_nsg_rule_appends_insufficient_evidence_hop()
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildPublicStoragePathSnapshot(includeNsgRoute: false);
        InventoryReachabilityPathGraphSnapshot graph = InventoryReachabilityPathGraph.Build(snapshot);

        IReadOnlyList<ReachabilityPathCandidate> candidates =
            IntendedReachabilityPathEnumerator.Enumerate(graph, new PrivilegePathEngineOptions());

        ReachabilityPathCandidate candidate = candidates.Should().ContainSingle().Subject;
        candidate.HasInsufficientEvidenceHop.Should().BeTrue();
        candidate.Hops[^1].EdgeType.Should().Be(SecureNowArchitectConstants.InsufficientEvidenceNsgHopEdgeType);
    }

    [Fact]
    public void Enumerate_storage_publicNetworkAccess_enabled_produces_internet_exposure_path()
    {
        Guid storageRowId = Guid.NewGuid();
        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = CreateHeader(),
            Resources =
            [
                Resource(StorageArm, "Microsoft.Storage/storageAccounts", storageRowId),
            ],
            Properties =
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = storageRowId,
                    PropertyKey = "publicNetworkAccess",
                    PropertyValue = "Enabled",
                },
            ],
        };

        InventoryReachabilityPathGraphSnapshot graph = InventoryReachabilityPathGraph.Build(snapshot);
        IReadOnlyList<ReachabilityPathCandidate> candidates =
            IntendedReachabilityPathEnumerator.Enumerate(graph, new PrivilegePathEngineOptions());

        ReachabilityPathCandidate candidate = candidates.Should().ContainSingle().Subject;
        candidate.Hops[0].FromNodeId.Should().Be(SecureNowArchitectConstants.InternetPublicExposureNodeId);
        candidate.Hops[0].EdgeType.Should().Be(SecureNowArchitectConstants.PublicNetworkAccessHopEdgeType);
        candidate.TerminalAssetNodeId.Should().Be(StorageArm);
    }

    [Fact]
    public void Enumerate_pe_reachable_target_produces_private_intended_path_from_app()
    {
        const string vnetArm =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1";
        const string subnetArm = $"{vnetArm}/subnets/app";
        const string appArm =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app1";
        const string peArm =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe1";
        const string zoneArm =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateDnsZones/privatelink.database.windows.net";

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = CreateHeader(),
            Resources =
            [
                Resource(appArm, "Microsoft.Web/sites"),
                Resource(SqlArm, "Microsoft.Sql/servers"),
                Resource(peArm, "Microsoft.Network/privateEndpoints"),
                Resource(zoneArm, "Microsoft.Network/privateDnsZones"),
            ],
            Relationships =
            [
                Observed(appArm, subnetArm, GraphEdgeInferenceSources.InventoryAppServiceSubnet),
                Observed(peArm, SqlArm, GraphEdgeInferenceSources.InventoryPrivateEndpoint),
                Observed(peArm, zoneArm, GraphEdgeInferenceSources.InventoryPeDnsZoneGroup),
                Observed(zoneArm, vnetArm, GraphEdgeInferenceSources.InventoryPrivateDnsVnet),
                Derived(appArm, SqlArm, GraphEdgeInferenceSources.InventoryPeReachableTarget),
            ],
        };

        InventoryReachabilityPathGraphSnapshot graph = InventoryReachabilityPathGraph.Build(snapshot);
        IReadOnlyList<ReachabilityPathCandidate> candidates =
            IntendedReachabilityPathEnumerator.Enumerate(graph, new PrivilegePathEngineOptions());

        ReachabilityPathCandidate candidate = candidates.Should().ContainSingle().Subject;
        candidate.Hops[0].FromNodeId.Should().Be(appArm);
        candidate.Hops.Should().Contain(hop =>
            hop.InferenceSource == GraphEdgeInferenceSources.InventoryPeReachableTarget);
        candidate.HasInsufficientEvidenceHop.Should().BeFalse();
        candidate.TerminalAssetNodeId.Should().Be(SqlArm);
    }

    [Fact]
    public void Enumerate_custom_vnet_dns_on_private_path_appends_insufficient_hop()
    {
        const string vnetArm =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1";
        const string subnetArm = $"{vnetArm}/subnets/app";
        const string appArm =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app1";
        const string peArm =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe1";
        const string zoneArm =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateDnsZones/privatelink.database.windows.net";
        Guid vnetRowId = Guid.NewGuid();

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = CreateHeader(),
            Resources =
            [
                Resource(vnetArm, "Microsoft.Network/virtualNetworks", vnetRowId),
                Resource(appArm, "Microsoft.Web/sites"),
                Resource(SqlArm, "Microsoft.Sql/servers"),
                Resource(peArm, "Microsoft.Network/privateEndpoints"),
                Resource(zoneArm, "Microsoft.Network/privateDnsZones"),
            ],
            Properties =
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = vnetRowId,
                    PropertyKey = "dhcpOptions",
                    PropertyValue = """{"dnsServers":["10.0.0.4"]}""",
                },
            ],
            Relationships =
            [
                Observed(appArm, subnetArm, GraphEdgeInferenceSources.InventoryAppServiceSubnet),
                Observed(peArm, SqlArm, GraphEdgeInferenceSources.InventoryPrivateEndpoint),
                Observed(peArm, zoneArm, GraphEdgeInferenceSources.InventoryPeDnsZoneGroup),
                Observed(zoneArm, vnetArm, GraphEdgeInferenceSources.InventoryPrivateDnsVnet),
                Derived(appArm, SqlArm, GraphEdgeInferenceSources.InventoryPeReachableTarget),
            ],
        };

        InventoryReachabilityPathGraphSnapshot graph = InventoryReachabilityPathGraph.Build(snapshot);
        IReadOnlyList<ReachabilityPathCandidate> candidates =
            IntendedReachabilityPathEnumerator.Enumerate(graph, new PrivilegePathEngineOptions());

        ReachabilityPathCandidate candidate = candidates.Should().ContainSingle().Subject;
        candidate.HasInsufficientEvidenceHop.Should().BeTrue();
        candidate.Hops[^1].EdgeType.Should().Be(
            SecureNowArchitectConstants.InsufficientEvidenceCustomDnsResolverHopEdgeType);
    }

    [Fact]
    public void Enumerate_missing_dns_join_appends_insufficient_evidence_hop()
    {
        const string vnetArm =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/virtualNetworks/vnet1";
        const string subnetArm = $"{vnetArm}/subnets/app";
        const string appArm =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Web/sites/app1";
        const string peArm =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe1";

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = CreateHeader(),
            Resources =
            [
                Resource(appArm, "Microsoft.Web/sites"),
                Resource(SqlArm, "Microsoft.Sql/servers"),
                Resource(peArm, "Microsoft.Network/privateEndpoints"),
            ],
            Relationships =
            [
                Observed(appArm, subnetArm, GraphEdgeInferenceSources.InventoryAppServiceSubnet),
                Observed(peArm, SqlArm, GraphEdgeInferenceSources.InventoryPrivateEndpoint),
                Observed(appArm, SqlArm, GraphEdgeInferenceSources.InventoryServiceConnectorLink),
            ],
        };

        InventoryReachabilityPathGraphSnapshot graph = InventoryReachabilityPathGraph.Build(snapshot);
        IReadOnlyList<ReachabilityPathCandidate> candidates =
            IntendedReachabilityPathEnumerator.Enumerate(graph, new PrivilegePathEngineOptions());

        ReachabilityPathCandidate candidate = candidates.Should().ContainSingle().Subject;
        candidate.HasInsufficientEvidenceHop.Should().BeTrue();
        candidate.Hops[^1].EdgeType.Should().Be(SecureNowArchitectConstants.InsufficientEvidenceDnsHopEdgeType);
    }

    [Fact]
    public void Enumerate_subnet_with_forced_tunnel_route_appends_edge_control_insufficient_hop()
    {
        const string routeTableArm =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/routeTables/rt1";
        Guid routeTableRowId = Guid.NewGuid();
        Guid storageRowId = Guid.NewGuid();

        AzureInventorySnapshotDetailReadModel baseSnapshot = BuildPublicStoragePathSnapshot(includeNsgRoute: true);
        List<AzureInventoryResourceRecord> resources = [..baseSnapshot.Resources];
        resources.Add(Resource(routeTableArm, "Microsoft.Network/routeTables", routeTableRowId));
        List<AzureInventoryResourcePropertyReadModel> properties = [..baseSnapshot.Properties];
        properties.Add(new AzureInventoryResourcePropertyReadModel
        {
            ResourceRowId = routeTableRowId,
            PropertyKey = "inventory.policy.route.0.addressPrefix",
            PropertyValue = "0.0.0.0/0",
        });
        properties.Add(new AzureInventoryResourcePropertyReadModel
        {
            ResourceRowId = routeTableRowId,
            PropertyKey = "inventory.policy.route.0.nextHopType",
            PropertyValue = "VirtualNetworkGateway",
        });
        List<AzureInventoryResourceRelationshipReadModel> relationships = [..baseSnapshot.Relationships];
        relationships.Add(Observed(SubnetArm, routeTableArm, GraphEdgeInferenceSources.InventorySubnetRouteTable));

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = baseSnapshot.Header,
            Resources = resources,
            Properties = properties,
            Relationships = relationships,
        };

        InventoryReachabilityPathGraphSnapshot graph = InventoryReachabilityPathGraph.Build(snapshot);
        IReadOnlyList<ReachabilityPathCandidate> candidates =
            IntendedReachabilityPathEnumerator.Enumerate(graph, new PrivilegePathEngineOptions());

        ReachabilityPathCandidate candidate = candidates.Should().ContainSingle().Subject;
        candidate.HasInsufficientEvidenceHop.Should().BeTrue();
        candidate.Hops[^1].EdgeType.Should().Be(
            SecureNowArchitectConstants.InsufficientEvidenceNetworkEdgeControlHopEdgeType);
    }

    [Fact]
    public void Enumerate_subnet_routed_through_firewall_with_allow_rule_appends_allowed_edge_control_hop()
    {
        const string routeTableArm =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/routeTables/rt1";
        const string firewallArm =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";
        Guid routeTableRowId = Guid.NewGuid();
        Guid firewallRowId = Guid.NewGuid();
        Guid storageRowId = Guid.NewGuid();

        AzureInventorySnapshotDetailReadModel baseSnapshot = BuildPublicStoragePathSnapshot(includeNsgRoute: true);
        List<AzureInventoryResourceRecord> resources = [..baseSnapshot.Resources];
        resources.Add(Resource(routeTableArm, "Microsoft.Network/routeTables", routeTableRowId));
        resources.Add(Resource(firewallArm, "Microsoft.Network/azureFirewalls", firewallRowId));
        List<AzureInventoryResourcePropertyReadModel> properties = [..baseSnapshot.Properties];
        properties.Add(new AzureInventoryResourcePropertyReadModel
        {
            ResourceRowId = routeTableRowId,
            PropertyKey = "inventory.policy.route.0.addressPrefix",
            PropertyValue = "0.0.0.0/0",
        });
        properties.Add(new AzureInventoryResourcePropertyReadModel
        {
            ResourceRowId = routeTableRowId,
            PropertyKey = "inventory.policy.route.0.nextHopType",
            PropertyValue = "VirtualAppliance",
        });
        properties.Add(new AzureInventoryResourcePropertyReadModel
        {
            ResourceRowId = routeTableRowId,
            PropertyKey = "inventory.policy.route.0.nextHopArmId",
            PropertyValue = firewallArm,
        });
        properties.Add(new AzureInventoryResourcePropertyReadModel
        {
            ResourceRowId = firewallRowId,
            PropertyKey = AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey,
            PropertyValue = """
                [
                  {
                    "properties": {
                      "priority": 200,
                      "rules": [
                        {
                          "properties": {
                            "name": "allow-internet",
                            "priority": 100,
                            "action": { "type": "Allow" },
                            "sourceAddresses": ["*"],
                            "destinationAddresses": ["*"],
                            "destinationPorts": ["*"],
                            "ipProtocols": ["TCP"]
                          }
                        }
                      ]
                    }
                  }
                ]
                """,
        });
        List<AzureInventoryResourceRelationshipReadModel> relationships = [..baseSnapshot.Relationships];
        relationships.Add(Observed(SubnetArm, routeTableArm, GraphEdgeInferenceSources.InventorySubnetRouteTable));

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = baseSnapshot.Header,
            Resources = resources,
            Properties = properties,
            Relationships = relationships,
        };

        InventoryReachabilityPathGraphSnapshot graph = InventoryReachabilityPathGraph.Build(snapshot);
        IReadOnlyList<ReachabilityPathCandidate> candidates =
            IntendedReachabilityPathEnumerator.Enumerate(graph, new PrivilegePathEngineOptions());

        ReachabilityPathCandidate candidate = candidates.Should().ContainSingle().Subject;
        candidate.HasInsufficientEvidenceHop.Should().BeFalse();
        candidate.Hops[^1].EdgeType.Should().Be(SecureNowArchitectConstants.NetworkEdgeControlAllowedHopEdgeType);
        candidate.Hops.Should().NotContain(hop =>
            hop.EdgeType == SecureNowArchitectConstants.InsufficientEvidenceNetworkEdgeControlHopEdgeType);
    }

    [Fact]
    public void Enumerate_subnet_routed_through_firewall_with_deny_rule_drops_path()
    {
        const string routeTableArm =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/routeTables/rt1";
        const string firewallArm =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/azureFirewalls/fw1";
        Guid routeTableRowId = Guid.NewGuid();
        Guid firewallRowId = Guid.NewGuid();

        AzureInventorySnapshotDetailReadModel baseSnapshot = BuildPublicStoragePathSnapshot(includeNsgRoute: true);
        List<AzureInventoryResourceRecord> resources = [..baseSnapshot.Resources];
        resources.Add(Resource(routeTableArm, "Microsoft.Network/routeTables", routeTableRowId));
        resources.Add(Resource(firewallArm, "Microsoft.Network/azureFirewalls", firewallRowId));
        List<AzureInventoryResourcePropertyReadModel> properties = [..baseSnapshot.Properties];
        properties.Add(new AzureInventoryResourcePropertyReadModel
        {
            ResourceRowId = routeTableRowId,
            PropertyKey = "inventory.policy.route.0.addressPrefix",
            PropertyValue = "0.0.0.0/0",
        });
        properties.Add(new AzureInventoryResourcePropertyReadModel
        {
            ResourceRowId = routeTableRowId,
            PropertyKey = "inventory.policy.route.0.nextHopType",
            PropertyValue = "VirtualAppliance",
        });
        properties.Add(new AzureInventoryResourcePropertyReadModel
        {
            ResourceRowId = routeTableRowId,
            PropertyKey = "inventory.policy.route.0.nextHopArmId",
            PropertyValue = firewallArm,
        });
        properties.Add(new AzureInventoryResourcePropertyReadModel
        {
            ResourceRowId = firewallRowId,
            PropertyKey = AzureInventoryAzureFirewallNetworkRuleParser.NetworkRuleCollectionsPropertyKey,
            PropertyValue = """
                [
                  {
                    "properties": {
                      "priority": 200,
                      "rules": [
                        {
                          "properties": {
                            "name": "deny-all",
                            "priority": 100,
                            "action": { "type": "Deny" },
                            "sourceAddresses": ["*"],
                            "destinationAddresses": ["*"],
                            "destinationPorts": ["*"],
                            "ipProtocols": ["TCP"]
                          }
                        }
                      ]
                    }
                  }
                ]
                """,
        });
        List<AzureInventoryResourceRelationshipReadModel> relationships = [..baseSnapshot.Relationships];
        relationships.Add(Observed(SubnetArm, routeTableArm, GraphEdgeInferenceSources.InventorySubnetRouteTable));

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = baseSnapshot.Header,
            Resources = resources,
            Properties = properties,
            Relationships = relationships,
        };

        InventoryReachabilityPathGraphSnapshot graph = InventoryReachabilityPathGraph.Build(snapshot);
        IReadOnlyList<ReachabilityPathCandidate> candidates =
            IntendedReachabilityPathEnumerator.Enumerate(graph, new PrivilegePathEngineOptions());

        candidates.Should().BeEmpty();
    }

    [Fact]
    public void Enumerate_public_asset_behind_agw_without_traversing_agw_appends_edge_control_hop()
    {
        const string agwArm =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/applicationGateways/agw1";
        Guid storageRowId = Guid.NewGuid();

        AzureInventorySnapshotDetailReadModel snapshot = new()
        {
            Header = CreateHeader(),
            Resources =
            [
                Resource(agwArm, "Microsoft.Network/applicationGateways"),
                Resource(StorageArm, "Microsoft.Storage/storageAccounts", storageRowId),
            ],
            Properties =
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = storageRowId,
                    PropertyKey = "publicNetworkAccess",
                    PropertyValue = "Enabled",
                },
            ],
            Relationships =
            [
                Observed(agwArm, StorageArm, GraphEdgeInferenceSources.InventoryAgwBackend),
            ],
        };

        InventoryReachabilityPathGraphSnapshot graph = InventoryReachabilityPathGraph.Build(snapshot);
        IReadOnlyList<ReachabilityPathCandidate> candidates =
            IntendedReachabilityPathEnumerator.Enumerate(graph, new PrivilegePathEngineOptions());

        ReachabilityPathCandidate candidate = candidates.Should().ContainSingle().Subject;
        candidate.HasInsufficientEvidenceHop.Should().BeTrue();
        candidate.Hops[^1].EdgeType.Should().Be(
            SecureNowArchitectConstants.InsufficientEvidenceNetworkEdgeControlHopEdgeType);
    }

    [Fact]
    public async Task RunAsync_without_nsg_sets_path_confidence_to_insufficient_evidence()
    {
        ScopeContext scope = CreateScope();
        AzureInventorySnapshotDetailReadModel snapshot = BuildPublicStoragePathSnapshot(includeNsgRoute: false);
        InMemorySecurityEvidencePathRepository pathRepository = new();
        IntendedReachabilityEngine sut = CreateEngine(
            snapshot,
            scope,
            pathRepository,
            new InMemoryOperationalSecurityFindingRepository());

        await sut.RunAsync(scope, SnapshotId, SecureNowArchitectConstants.SystemActorId, CancellationToken.None);

        pathRepository.StoredPaths.Should().ContainSingle().Which.PathConfidenceBand
            .Should().Be(PathConfidenceBand.InsufficientEvidence);
    }

    [Fact]
    public void Enumerate_private_endpoint_only_sql_produces_no_internet_paths()
    {
        AzureInventorySnapshotDetailReadModel snapshot = BuildPrivateEndpointSqlSnapshot();
        InventoryReachabilityPathGraphSnapshot graph = InventoryReachabilityPathGraph.Build(snapshot);

        IReadOnlyList<ReachabilityPathCandidate> candidates =
            IntendedReachabilityPathEnumerator.Enumerate(graph, new PrivilegePathEngineOptions());

        candidates.Should().BeEmpty();
    }

    [Fact]
    public async Task RunAsync_foreign_tenant_returns_not_found()
    {
        ScopeContext ownerScope = CreateScope();
        ScopeContext foreignScope = new()
        {
            TenantId = Guid.Parse("99999999-9999-9999-9999-999999999999"),
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

        IntendedReachabilityEngine sut = CreateEngine(
            BuildPublicStoragePathSnapshot(includeNsgRoute: true),
            ownerScope,
            new InMemorySecurityEvidencePathRepository(),
            new InMemoryOperationalSecurityFindingRepository());

        PrivilegePathEngineResult result = await sut.RunAsync(
            foreignScope,
            SnapshotId,
            SecureNowArchitectConstants.SystemActorId,
            CancellationToken.None);

        result.Succeeded.Should().BeFalse();
        result.ErrorMessage.Should().Contain("not found");
    }

    [Fact]
    public async Task RunAsync_second_run_deduplicates_findings()
    {
        ScopeContext scope = CreateScope();
        AzureInventorySnapshotDetailReadModel snapshot = BuildPublicStoragePathSnapshot(includeNsgRoute: true);
        InMemorySecurityEvidencePathRepository pathRepository = new();
        InMemoryOperationalSecurityFindingRepository findingRepository = new();
        IntendedReachabilityEngine sut = CreateEngine(snapshot, scope, pathRepository, findingRepository);

        PrivilegePathEngineResult first = await sut.RunAsync(
            scope,
            SnapshotId,
            SecureNowArchitectConstants.SystemActorId,
            CancellationToken.None);

        PrivilegePathEngineResult second = await sut.RunAsync(
            scope,
            SnapshotId,
            SecureNowArchitectConstants.SystemActorId,
            CancellationToken.None);

        first.FindingsIngested.Should().BeGreaterThan(0);
        second.FindingsDeduplicated.Should().Be(first.PathsDiscovered);
        findingRepository.StoredFindings.Should().HaveCount(first.FindingsIngested);
    }

    [Fact]
    public void IntendedReachabilityEngine_is_not_a_finding_engine_plugin()
    {
        typeof(IntendedReachabilityEngine).Should().NotImplement<IFindingEngine>();
        typeof(IntendedReachabilityEngine).Should().NotImplement<IEffectfulFindingEngine>();
    }

    private static AzureInventorySnapshotDetailReadModel BuildPublicStoragePathSnapshot(bool includeNsgRoute)
    {
        Guid storageRowId = Guid.NewGuid();

        List<AzureInventoryResourceRelationshipReadModel> relationships =
        [
            new()
            {
                FromAzureResourceId = PublicIpArm,
                ToAzureResourceId = NicArm,
                RelationshipType = GraphEdgeTypes.Exposes,
                ProvenanceKind = ProvenanceKind.ObservedFact,
            },
            new()
            {
                FromAzureResourceId = NicArm,
                ToAzureResourceId = SubnetArm,
                RelationshipType = GraphEdgeTypes.ConnectsTo,
                ProvenanceKind = ProvenanceKind.ObservedFact,
            },
        ];

        if (includeNsgRoute)
        {
            relationships.Add(new AzureInventoryResourceRelationshipReadModel
            {
                FromAzureResourceId = SubnetArm,
                ToAzureResourceId = StorageArm,
                RelationshipType = GraphEdgeTypes.RoutesTo,
                ProvenanceKind = ProvenanceKind.DeterministicInference,
            });
        }
        else
        {
            relationships.Add(new AzureInventoryResourceRelationshipReadModel
            {
                FromAzureResourceId = SubnetArm,
                ToAzureResourceId = StorageArm,
                RelationshipType = GraphEdgeTypes.ConnectsTo,
                ProvenanceKind = ProvenanceKind.ObservedFact,
            });
        }

        return new AzureInventorySnapshotDetailReadModel
        {
            Header = CreateHeader(),
            Resources =
            [
                Resource(PublicIpArm, "Microsoft.Network/publicIPAddresses"),
                Resource(NicArm, "Microsoft.Network/networkInterfaces"),
                Resource(SubnetArm, "Microsoft.Network/virtualNetworks/subnets"),
                Resource(StorageArm, "Microsoft.Storage/storageAccounts", storageRowId),
            ],
            Relationships = relationships,
        };
    }

    private static AzureInventorySnapshotDetailReadModel BuildPrivateEndpointSqlSnapshot()
    {
        Guid sqlRowId = Guid.NewGuid();
        const string privateEndpointArm =
            "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/privateEndpoints/pe1";

        return new AzureInventorySnapshotDetailReadModel
        {
            Header = CreateHeader(),
            Resources =
            [
                Resource(SqlArm, "Microsoft.Sql/servers", sqlRowId),
                Resource(privateEndpointArm, "Microsoft.Network/privateEndpoints"),
            ],
            Properties =
            [
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = sqlRowId,
                    PropertyKey = "privateEndpointConnections",
                    PropertyValue = "[{\"id\":\"/subscriptions/sub/.../privateEndpointConnections/peconn1\"}]",
                },
                new AzureInventoryResourcePropertyReadModel
                {
                    ResourceRowId = sqlRowId,
                    PropertyKey = "enablePublicNetworkAccess",
                    PropertyValue = "false",
                },
            ],
            Relationships =
            [
                new AzureInventoryResourceRelationshipReadModel
                {
                    FromAzureResourceId = privateEndpointArm,
                    ToAzureResourceId = SqlArm,
                    RelationshipType = GraphEdgeTypes.ConnectsTo,
                    ProvenanceKind = ProvenanceKind.ObservedFact,
                },
            ],
        };
    }

    private static AzureInventoryResourceRelationshipReadModel Observed(
        string from,
        string to,
        string inferenceSource) =>
        new()
        {
            FromAzureResourceId = from,
            ToAzureResourceId = to,
            RelationshipType = GraphEdgeTypes.ConnectsTo,
            ProvenanceKind = ProvenanceKind.ObservedFact,
            InferenceSource = inferenceSource,
        };

    private static AzureInventoryResourceRelationshipReadModel Derived(
        string from,
        string to,
        string inferenceSource) =>
        new()
        {
            FromAzureResourceId = from,
            ToAzureResourceId = to,
            RelationshipType = GraphEdgeTypes.ConnectsTo,
            ProvenanceKind = ProvenanceKind.DerivedFact,
            InferenceSource = inferenceSource,
        };

    private static AzureInventoryResourceRecord Resource(
        string armId,
        string resourceType,
        Guid? rowId = null) =>
        new()
        {
            ResourceRowId = rowId ?? Guid.NewGuid(),
            SnapshotId = SnapshotId,
            TenantId = TenantId,
            AzureResourceId = armId,
            ResourceType = resourceType,
            CloudResourceId = rowId ?? Guid.NewGuid(),
        };

    private static IntendedReachabilityEngine CreateEngine(
        AzureInventorySnapshotDetailReadModel snapshot,
        ScopeContext scope,
        InMemorySecurityEvidencePathRepository pathRepository,
        InMemoryOperationalSecurityFindingRepository findingRepository)
    {
        Mock<IAzureInventorySnapshotRepository> snapshotRepository = new();
        snapshotRepository
            .Setup(repository => repository.TryGetSnapshotDetailAsync(scope, SnapshotId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(snapshot);

        Mock<IAuditService> auditService = new();
        auditService
            .Setup(service => service.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        OperationalSecurityFindingIngestService ingestService = new(
            findingRepository,
            auditService.Object,
            NullLogger<OperationalSecurityFindingIngestService>.Instance);

        return new IntendedReachabilityEngine(
            snapshotRepository.Object,
            pathRepository,
            ingestService,
            NullLogger<IntendedReachabilityEngine>.Instance,
            new NoOpSecurityEvidencePathSearchCoverageRepository());
    }

    private static AzureInventorySnapshotRecord CreateHeader() =>
        new()
        {
            SnapshotId = SnapshotId,
            TenantId = TenantId,
            SubscriptionId = "sub",
            CaptureStatus = AzureInventoryCaptureStatus.Succeeded,
        };

    private static ScopeContext CreateScope() =>
        new()
        {
            TenantId = TenantId,
            WorkspaceId = WorkspaceId,
            ProjectId = ProjectId,
        };

    private sealed class InMemorySecurityEvidencePathRepository : ISecurityEvidencePathRepository
    {
        public List<SecurityEvidencePathRecord> StoredPaths { get; } = [];

        public List<SecurityEvidencePathHopRecord> StoredHops { get; } = [];

        public Task<SecurityEvidencePathRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult(StoredPaths.FirstOrDefault(path => path.TenantId == tenantId && path.PathId == pathId));

        public Task<SecurityEvidencePathRecord?> TryGetByCanonicalHashAsync(
            Guid tenantId,
            Guid snapshotId,
            byte[] canonicalHopHashSha256,
            CancellationToken cancellationToken = default)
        {
            SecurityEvidencePathRecord? match = StoredPaths.FirstOrDefault(path =>
                path.TenantId == tenantId
                && path.SnapshotId == snapshotId
                && path.CanonicalHopHashSha256.SequenceEqual(canonicalHopHashSha256));

            return Task.FromResult(match);
        }

        public Task<IReadOnlyList<SecurityEvidencePathHopRecord>> ListHopsByPathAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<SecurityEvidencePathHopRecord>>(
                StoredHops
                    .Where(hop => hop.TenantId == tenantId && hop.PathId == pathId)
                    .OrderBy(static hop => hop.HopOrdinal)
                    .ToList());

        public Task<SecurityEvidencePathInsertResult> InsertIfNotExistsAsync(
            SecurityEvidencePathRecord pathHeader,
            IReadOnlyList<SecurityEvidencePathHopRecord> hops,
            CancellationToken cancellationToken = default)
        {
            SecurityEvidencePathGuard.ValidatedPath validated =
                SecurityEvidencePathGuard.ValidateAndMaterialize(pathHeader, hops);

            SecurityEvidencePathRecord? existing = StoredPaths.FirstOrDefault(path =>
                path.TenantId == validated.Path.TenantId
                && path.SnapshotId == validated.Path.SnapshotId
                && path.CanonicalHopHashSha256.SequenceEqual(validated.Path.CanonicalHopHashSha256));

            if (existing is not null)
            {
                return Task.FromResult(new SecurityEvidencePathInsertResult
                {
                    PathId = existing.PathId,
                    Created = false,
                });
            }

            StoredPaths.Add(validated.Path);
            StoredHops.AddRange(validated.Hops);

            return Task.FromResult(new SecurityEvidencePathInsertResult
            {
                PathId = validated.Path.PathId,
                Created = true,
            });
        }

        public Task<(IReadOnlyList<SecurityEvidencePathRecord> Items, int TotalCount)> ListPagedAsync(
            Guid tenantId,
            Guid workspaceId,
            Guid projectId,
            SecurityEvidencePathListFilter filter,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<(IReadOnlyList<SecurityEvidencePathRecord> Items, int TotalCount)>((StoredPaths, StoredPaths.Count));

        public Task<IReadOnlyList<SecurityEvidencePathRecord>> ListBySnapshotAsync(
            ProjectSnapshotScopeKey scope,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<SecurityEvidencePathRecord>>(
                StoredPaths
                    .Where(path =>
                        path.TenantId == scope.TenantId
                        && path.WorkspaceId == scope.WorkspaceId
                        && path.ProjectId == scope.ProjectId
                        && path.SnapshotId == scope.SnapshotId)
                    .ToList());
    }

    private sealed class InMemoryOperationalSecurityFindingRepository : IOperationalSecurityFindingRepository
    {
        public List<OperationalSecurityFindingRecord> StoredFindings { get; } = [];

        public Task<OperationalSecurityFindingRecord?> TryGetByNaturalKeyAsync(
            Guid tenantId,
            CloudProvider provider,
            string sourceSystem,
            string sourceFindingId,
            CancellationToken cancellationToken = default)
        {
            OperationalSecurityFindingRecord? match = StoredFindings.FirstOrDefault(finding =>
                finding.TenantId == tenantId
                && finding.Provider == provider
                && finding.SourceSystem == sourceSystem
                && finding.SourceFindingId == sourceFindingId);

            return Task.FromResult(match);
        }

        public Task<OperationalSecurityFindingRecord?> TryGetByIdAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<OperationalSecurityFindingRecord?>(null);

        public Task<IReadOnlyList<OperationalSecurityFindingRecord>> ListByTenantAsync(
            Guid tenantId,
            OperationalSecurityFindingStatus? status,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityFindingRecord>>(StoredFindings.ToList());

        public Task<(IReadOnlyList<OperationalSecurityFindingRecord> Items, int TotalCount)> ListByCloudResourceIdPagedAsync(
            Guid tenantId,
            Guid cloudResourceId,
            int page,
            int pageSize,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<(IReadOnlyList<OperationalSecurityFindingRecord> Items, int TotalCount)>(([], 0));

        public Task<IReadOnlyList<Guid>> ListFindingIdsByPathIdAsync(
            Guid tenantId,
            Guid pathId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<Guid>>([]);

        public Task<IReadOnlyList<OperationalSecurityFindingMetadataRecord>> ListMetadataByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityFindingMetadataRecord>>([]);

        public Task<IReadOnlyList<OperationalSecurityFindingObservationRecord>> ListObservationsByFindingAsync(
            Guid tenantId,
            Guid findingId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<IReadOnlyList<OperationalSecurityFindingObservationRecord>>([]);

        public Task InsertAsync(
            OperationalSecurityFindingRecord finding,
            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
            OperationalSecurityFindingObservationRecord observation,
            CancellationToken cancellationToken = default)
        {
            StoredFindings.Add(finding);
            return Task.CompletedTask;
        }

        public Task UpdateAsync(
            OperationalSecurityFindingRecord finding,
            IReadOnlyList<OperationalSecurityFindingMetadataRecord> metadata,
            OperationalSecurityFindingObservationRecord? observation,
            CancellationToken cancellationToken = default) =>
            Task.CompletedTask;
    }
}
