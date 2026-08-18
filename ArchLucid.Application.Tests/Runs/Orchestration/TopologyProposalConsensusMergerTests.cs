using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Application.Runs.Orchestration;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

[Trait("Category", "Unit")]
public sealed class TopologyProposalConsensusMergerTests
{
    [Fact]
    public void Merge_intersects_and_reports_disagreements()
    {
        AgentTopologyProposal primary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices =
            [
                new ManifestService { ServiceName = "OrdersApi", ServiceType = ServiceType.Api, RuntimePlatform = RuntimePlatform.AppService },
                new ManifestService { ServiceName = "Worker", ServiceType = ServiceType.Worker, RuntimePlatform = RuntimePlatform.ContainerApps },
            ],
        };

        AgentTopologyProposal secondary = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices =
            [
                new ManifestService { ServiceName = "OrdersApi", ServiceType = ServiceType.Api, RuntimePlatform = RuntimePlatform.AppService },
            ],
        };

        TopologyProposalConsensusMergeResult result = TopologyProposalConsensusMerger.Merge(primary, secondary);

        result.DisagreementCount.Should().BeGreaterThan(0);
        result.MergedProposal.AddedServices.Should().ContainSingle();
        result.MergedProposal.Warnings.Should().ContainSingle(w => w.Contains("dual-model consensus", StringComparison.OrdinalIgnoreCase));
    }
}
