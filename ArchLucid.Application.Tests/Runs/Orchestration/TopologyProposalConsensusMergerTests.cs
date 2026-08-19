using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
public sealed class TopologyProposalConsensusMergerTests
{
    [Fact]
    public void Merge_intersects_services_when_models_use_rename_alias_labels_for_same_service_id()
    {
        AgentTopologyProposal primary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices =
            [
                new ManifestService
                {
                    ServiceName = "api",
                    ServiceId = "svc-api",
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
    }
}
