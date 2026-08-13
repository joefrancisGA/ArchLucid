using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
public sealed class AgentProposalStructuralPostProcessorTests
{
    [Fact]
    public void ApplyToProposal_dedupes_services_and_sets_source_agent()
    {
        AgentTopologyProposal proposal = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices =
            [
                new ManifestService { ServiceName = "api", ServiceType = ServiceType.Api, RuntimePlatform = RuntimePlatform.AppService },
                new ManifestService { ServiceName = "api", ServiceType = ServiceType.Api, RuntimePlatform = RuntimePlatform.Functions },
            ],
        };

        AgentProposalStructuralPostProcessor.ApplyToProposal(AgentType.Cost, proposal);

        proposal.SourceAgent.Should().Be(AgentType.Cost);
        proposal.AddedServices.Should().ContainSingle();
        proposal.AddedServices[0].RuntimePlatform.Should().Be(RuntimePlatform.AppService);
    }

    [Fact]
    public void ApplyToProposal_strips_relationships_without_known_endpoints()
    {
        AgentTopologyProposal proposal = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices =
            [
                new ManifestService { ServiceName = "api", ServiceType = ServiceType.Api, RuntimePlatform = RuntimePlatform.AppService },
            ],
            AddedDatastores =
            [
                new ManifestDatastore { DatastoreName = "db", DatastoreType = DatastoreType.Sql, RuntimePlatform = RuntimePlatform.SqlServer },
            ],
            AddedRelationships =
            [
                new ManifestRelationship { SourceId = "api", TargetId = "db", RelationshipType = RelationshipType.ReadsFrom },
                new ManifestRelationship { SourceId = "api", TargetId = "missing", RelationshipType = RelationshipType.Calls },
            ],
        };

        AgentProposalStructuralPostProcessor.ApplyToProposal(AgentType.Topology, proposal);

        proposal.AddedRelationships.Should().ContainSingle();
        proposal.AddedRelationships[0].TargetId.Should().Be("db");
    }

    [Fact]
    public void ApplyToProposal_dedupes_required_controls_for_compliance()
    {
        AgentTopologyProposal proposal = new()
        {
            SourceAgent = AgentType.Topology,
            RequiredControls = ["Key Vault", "Key Vault", "  Private Endpoints  ", ""],
        };

        AgentProposalStructuralPostProcessor.ApplyToProposal(AgentType.Compliance, proposal);

        proposal.RequiredControls.Should().BeEquivalentTo(["Key Vault", "Private Endpoints"]);
    }
}
