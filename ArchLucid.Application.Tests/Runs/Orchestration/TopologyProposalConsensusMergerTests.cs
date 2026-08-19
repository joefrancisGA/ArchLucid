<<<<<<< HEAD
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
=======
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Application.Runs.Orchestration;
>>>>>>> ecbef776c777b97fd241b3d0ccf36675cf50f51f

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
public sealed class TopologyProposalConsensusMergerTests
{
    [Fact]
<<<<<<< HEAD
    public void Merge_intersects_services_when_models_use_rename_alias_labels_for_same_service_id()
=======
    public void Merge_intersects_and_reports_disagreements()
>>>>>>> ecbef776c777b97fd241b3d0ccf36675cf50f51f
    {
        AgentTopologyProposal primary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices =
            [
<<<<<<< HEAD
                new ManifestService
                {
                    ServiceName = "api",
                    ServiceId = "svc-api",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.AppService,
                }
            ]
=======
                new ManifestService { ServiceName = "OrdersApi", ServiceType = ServiceType.Api, RuntimePlatform = RuntimePlatform.AppService },
                new ManifestService { ServiceName = "Worker", ServiceType = ServiceType.Worker, RuntimePlatform = RuntimePlatform.ContainerApps },
            ],
>>>>>>> ecbef776c777b97fd241b3d0ccf36675cf50f51f
        };

        AgentTopologyProposal secondary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices =
            [
<<<<<<< HEAD
                new ManifestService
                {
                    ServiceName = "renamed-api",
                    ServiceId = "svc-api",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.AppService,
                }
            ]
=======
                new ManifestService { ServiceName = "OrdersApi", ServiceType = ServiceType.Api, RuntimePlatform = RuntimePlatform.AppService },
            ],
>>>>>>> ecbef776c777b97fd241b3d0ccf36675cf50f51f
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

<<<<<<< HEAD
        result.DisagreementCount.Should().Be(0);
        result.MergedProposal.AddedServices.Should().ContainSingle()
            .Which.ServiceId.Should().Be("svc-api");
        result.MergedProposal.Warnings.Should().BeEmpty();
    }

    [Fact]
    public void Merge_intersects_datastores_when_models_use_rename_alias_labels_for_same_datastore_id()
    {
        AgentTopologyProposal primary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedDatastores =
            [
                new ManifestDatastore
                {
                    DatastoreName = "sql",
                    DatastoreId = "ds-sql",
                    DatastoreType = DatastoreType.Sql,
                    RuntimePlatform = RuntimePlatform.SqlServer,
                }
            ]
        };

        AgentTopologyProposal secondary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedDatastores =
            [
                new ManifestDatastore
                {
                    DatastoreName = "renamed-sql",
                    DatastoreId = "ds-sql",
                    DatastoreType = DatastoreType.Sql,
                    RuntimePlatform = RuntimePlatform.SqlServer,
                }
            ]
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.DisagreementCount.Should().Be(0);
        result.MergedProposal.AddedDatastores.Should().ContainSingle()
            .Which.DatastoreId.Should().Be("ds-sql");
        result.MergedProposal.Warnings.Should().BeEmpty();
    }

    [Fact]
    public void Merge_intersects_services_when_service_id_has_surrounding_whitespace()
    {
        AgentTopologyProposal primary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices =
            [
                new ManifestService
                {
                    ServiceName = "api",
                    ServiceId = "  svc-api  ",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.AppService,
                }
            ]
        };

        AgentTopologyProposal secondary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices =
            [
                new ManifestService
                {
                    ServiceName = "renamed-api",
                    ServiceId = "svc-api",
                    ServiceType = ServiceType.Api,
                    RuntimePlatform = RuntimePlatform.AppService,
                }
            ]
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.DisagreementCount.Should().Be(0);
        result.MergedProposal.AddedServices.Should().ContainSingle();
=======
        result.DisagreementCount.Should().BeGreaterThan(0);
        result.MergedProposal.AddedServices.Should().ContainSingle();
        result.MergedProposal.Warnings.Should().ContainSingle(w => w.Contains("dual-model consensus", StringComparison.OrdinalIgnoreCase));
>>>>>>> ecbef776c777b97fd241b3d0ccf36675cf50f51f
    }
}
