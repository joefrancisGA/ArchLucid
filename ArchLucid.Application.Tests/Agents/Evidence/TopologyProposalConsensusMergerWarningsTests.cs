using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Agents.Evidence;

[Trait("Category", "Unit")]
public sealed class TopologyProposalConsensusMergerWarningsTests
{
    [Fact]
    public void Merge_when_primary_warnings_is_null_does_not_throw()
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
            ],
            Warnings = null!,
        };

        AgentTopologyProposal secondary = new()
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
            ],
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.MergedProposal.Warnings.Should().NotBeNull();
        result.MergedProposal.AddedServices.Should().ContainSingle();
    }

    [Fact]
    public void Merge_when_required_controls_is_null_does_not_throw()
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
            ],
            RequiredControls = null!,
        };

        AgentTopologyProposal secondary = new()
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
            ],
            RequiredControls = null!,
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.MergedProposal.RequiredControls.Should().NotBeNull();
        result.MergedProposal.AddedServices.Should().ContainSingle();
    }

    [Fact]
    public void Merge_merged_proposal_collection_properties_are_never_null()
    {
        AgentTopologyProposal primary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices = [],
            AddedDatastores = [],
            AddedRelationships = [],
        };

        AgentTopologyProposal secondary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices = [],
            AddedDatastores = [],
            AddedRelationships = [],
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.MergedProposal.AddedServices.Should().NotBeNull();
        result.MergedProposal.AddedDatastores.Should().NotBeNull();
        result.MergedProposal.AddedRelationships.Should().NotBeNull();
    }

    [Fact]
    public void Merge_when_primary_added_services_is_null_does_not_throw()
    {
        AgentTopologyProposal primary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices = null!,
        };

        AgentTopologyProposal secondary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices = [],
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.MergedProposal.AddedServices.Should().NotBeNull().And.BeEmpty();
    }
}
