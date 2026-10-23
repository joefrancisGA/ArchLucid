using ArchLucid.Application.Agents.Evidence;
using ArchLucid.Contracts.Abstractions.Agents;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Findings;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Agents.Evidence;

[Trait("Suite", "Core")]
public sealed class TopologyProposalDualModelConsensusCrossAgentOrderTests
{
    [Fact]
    public async Task EnrichAsync_runs_dual_model_consensus_when_topology_row_omits_envelope_agent_type_but_findings_declare_topology()
    {
        AgentTopologyProposal primaryTopology = new()
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
                },
                new ManifestService
                {
                    ServiceName = "worker",
                    ServiceId = "svc-worker",
                    ServiceType = ServiceType.Worker,
                    RuntimePlatform = RuntimePlatform.AppService,
                },
            ],
        };

        AgentTopologyProposal secondaryTopology = new()
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
                },
            ],
        };

        List<AgentResult> results =
        [
            new AgentResult
            {
                RunId = "run-1",
                TaskId = "topology-task",
                ProposedChanges = primaryTopology,
                Findings =
                [
                    new ArchitectureFinding
                    {
                        SourceAgent = AgentType.Topology,
                        FindingId = "finding-typed",
                        Message = "Declare private endpoints for storage.",
                        Category = "Network",
                        Severity = FindingSeverity.Warning,
                    },
                ],
            },
        ];

        results[0].AgentType.Should().Be(default(AgentType));

        TopologyProposalDualModelConsensusEnricher consensus = CreateConsensusEnricher(secondaryTopology);
        await consensus.EnrichAsync(
            "run-1",
            new ArchitectureRequest { RequestId = "req", Description = new string('x', 12) },
            new AgentEvidencePackage(),
            results,
            CancellationToken.None);

        AgentTopologyProposal topologyAfter = (AgentTopologyProposal)results[0].ProposedChanges!;
        topologyAfter.AddedServices.Should().ContainSingle().Which.ServiceId.Should().Be("svc-api");
    }

    [Fact]
    public async Task EnrichAsync_prunes_sibling_relationships_when_dual_model_consensus_removes_topology_endpoint()
    {
        AgentTopologyProposal primaryTopology = new()
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
                },
                new ManifestService
                {
                    ServiceName = "worker",
                    ServiceId = "svc-worker",
                    ServiceType = ServiceType.Worker,
                    RuntimePlatform = RuntimePlatform.AppService,
                },
            ],
        };

        AgentTopologyProposal secondaryTopology = new()
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
                },
            ],
        };

        AgentTopologyProposal costProposal = new()
        {
            SourceAgent = AgentType.Cost,
            AddedRelationships =
            [
                new ManifestRelationship
                {
                    SourceId = "svc-api",
                    TargetId = "svc-worker",
                    RelationshipType = RelationshipType.Calls,
                },
            ],
        };

        List<AgentResult> results =
        [
            new AgentResult
            {
                RunId = "run-1",
                TaskId = "topology-task",
                AgentType = AgentType.Topology,
                ProposedChanges = primaryTopology,
            },
            new AgentResult
            {
                RunId = "run-1",
                TaskId = "cost-task",
                AgentType = AgentType.Cost,
                ProposedChanges = costProposal,
            },
        ];

        CrossAgentProposalConsistencyEnricher crossAgent = new();
        await crossAgent.EnrichAsync(
            "run-1",
            new ArchitectureRequest { RequestId = "req", Description = new string('x', 12) },
            new AgentEvidencePackage(),
            results,
            CancellationToken.None);

        TopologyProposalDualModelConsensusEnricher consensus = CreateConsensusEnricher(secondaryTopology);
        await consensus.EnrichAsync(
            "run-1",
            new ArchitectureRequest { RequestId = "req", Description = new string('x', 12) },
            new AgentEvidencePackage(),
            results,
            CancellationToken.None);

        AgentTopologyProposal topologyAfter = (AgentTopologyProposal)results[0].ProposedChanges!;
        topologyAfter.AddedServices.Should().ContainSingle().Which.ServiceId.Should().Be("svc-api");

        AgentTopologyProposal costAfter = (AgentTopologyProposal)results[1].ProposedChanges!;
        costAfter.AddedRelationships.Should().BeEmpty(
            "consensus removed svc-worker from topology so cost must not keep api→worker edges");
    }

    [Fact]
    public async Task EnrichAsync_prunes_sibling_relationships_when_consensus_intersection_has_no_endpoints()
    {
        AgentTopologyProposal primaryTopology = new()
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
                },
            ],
        };

        AgentTopologyProposal secondaryTopology = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices =
            [
                new ManifestService
                {
                    ServiceName = "worker",
                    ServiceId = "svc-worker",
                    ServiceType = ServiceType.Worker,
                    RuntimePlatform = RuntimePlatform.AppService,
                },
            ],
        };

        AgentTopologyProposal costProposal = new()
        {
            SourceAgent = AgentType.Cost,
            AddedRelationships =
            [
                new ManifestRelationship
                {
                    SourceId = "svc-api",
                    TargetId = "svc-worker",
                    RelationshipType = RelationshipType.Calls,
                },
            ],
        };

        List<AgentResult> results =
        [
            new AgentResult
            {
                RunId = "run-1",
                TaskId = "topology-task",
                AgentType = AgentType.Topology,
                ProposedChanges = primaryTopology,
            },
            new AgentResult
            {
                RunId = "run-1",
                TaskId = "cost-task",
                AgentType = AgentType.Cost,
                ProposedChanges = costProposal,
            },
        ];

        TopologyProposalDualModelConsensusEnricher consensus = CreateConsensusEnricher(secondaryTopology);
        await consensus.EnrichAsync(
            "run-1",
            new ArchitectureRequest { RequestId = "req", Description = new string('x', 12) },
            new AgentEvidencePackage(),
            results,
            CancellationToken.None);

        AgentTopologyProposal topologyAfter = (AgentTopologyProposal)results[0].ProposedChanges!;
        topologyAfter.AddedServices.Should().BeEmpty();

        AgentTopologyProposal costAfter = (AgentTopologyProposal)results[1].ProposedChanges!;
        costAfter.AddedRelationships.Should().BeEmpty(
            "empty consensus intersection means no topology endpoints remain for sibling relationship validation");
    }

    [Fact]
    public async Task EnrichAsync_keeps_sibling_relationships_to_declared_non_topology_endpoints_after_consensus()
    {
        AgentTopologyProposal primaryTopology = new()
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
                },
                new ManifestService
                {
                    ServiceName = "worker",
                    ServiceId = "svc-worker",
                    ServiceType = ServiceType.Worker,
                    RuntimePlatform = RuntimePlatform.AppService,
                },
            ],
        };

        AgentTopologyProposal secondaryTopology = new()
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
                },
            ],
        };

        AgentTopologyProposal criticProposal = new()
        {
            SourceAgent = AgentType.Critic,
            AddedServices =
            [
                new ManifestService
                {
                    ServiceName = "audit-log",
                    ServiceId = "svc-audit-log",
                    ServiceType = ServiceType.Worker,
                    RuntimePlatform = RuntimePlatform.AppService,
                },
            ],
            AddedRelationships =
            [
                new ManifestRelationship
                {
                    SourceId = "svc-audit-log",
                    TargetId = "svc-api",
                    RelationshipType = RelationshipType.Calls,
                },
            ],
        };

        List<AgentResult> results =
        [
            new AgentResult
            {
                RunId = "run-1",
                TaskId = "topology-task",
                AgentType = AgentType.Topology,
                ProposedChanges = primaryTopology,
            },
            new AgentResult
            {
                RunId = "run-1",
                TaskId = "critic-task",
                AgentType = AgentType.Critic,
                ProposedChanges = criticProposal,
            },
        ];

        CrossAgentProposalConsistencyEnricher crossAgent = new();
        await crossAgent.EnrichAsync(
            "run-1",
            new ArchitectureRequest { RequestId = "req", Description = new string('x', 12) },
            new AgentEvidencePackage(),
            results,
            CancellationToken.None);

        TopologyProposalDualModelConsensusEnricher consensus = CreateConsensusEnricher(secondaryTopology);
        await consensus.EnrichAsync(
            "run-1",
            new ArchitectureRequest { RequestId = "req", Description = new string('x', 12) },
            new AgentEvidencePackage(),
            results,
            CancellationToken.None);

        AgentTopologyProposal criticAfter = (AgentTopologyProposal)results[1].ProposedChanges!;
        criticAfter.AddedRelationships.Should().ContainSingle(
            "critic-declared endpoints must remain valid after consensus drops unrelated topology services");
        criticAfter.AddedRelationships![0].TargetId.Should().Be("svc-api");
    }

    [Fact]
    public async Task EnrichAsync_skips_null_sibling_service_entries_when_pruning_sibling_proposals()
    {
        AgentTopologyProposal primaryTopology = new()
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
                },
            ],
        };

        AgentTopologyProposal secondaryTopology = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices = primaryTopology.AddedServices,
        };

        AgentTopologyProposal criticProposal = new()
        {
            SourceAgent = AgentType.Critic,
            AddedServices =
            [
                null!,
                new ManifestService
                {
                    ServiceName = "audit-log",
                    ServiceId = "svc-audit-log",
                    ServiceType = ServiceType.Worker,
                    RuntimePlatform = RuntimePlatform.AppService,
                },
            ],
            AddedRelationships =
            [
                new ManifestRelationship
                {
                    SourceId = "svc-audit-log",
                    TargetId = "svc-api",
                    RelationshipType = RelationshipType.Calls,
                },
            ],
        };

        List<AgentResult> results =
        [
            new AgentResult
            {
                RunId = "run-1",
                TaskId = "topology-task",
                AgentType = AgentType.Topology,
                ProposedChanges = primaryTopology,
            },
            new AgentResult
            {
                RunId = "run-1",
                TaskId = "critic-task",
                AgentType = AgentType.Critic,
                ProposedChanges = criticProposal,
            },
        ];

        TopologyProposalDualModelConsensusEnricher consensus = CreateConsensusEnricher(secondaryTopology);

        Func<Task> act = async () => await consensus.EnrichAsync(
            "run-1",
            new ArchitectureRequest { RequestId = "req", Description = new string('x', 12) },
            new AgentEvidencePackage(),
            results,
            CancellationToken.None);

        await act.Should().NotThrowAsync();
        AgentTopologyProposal criticAfter = (AgentTopologyProposal)results[1].ProposedChanges!;
        criticAfter.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public async Task EnrichAsync_skips_null_relationship_entries_when_pruning_sibling_proposals()
    {
        AgentTopologyProposal primaryTopology = new()
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
                },
            ],
        };

        AgentTopologyProposal secondaryTopology = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices = primaryTopology.AddedServices,
        };

        AgentTopologyProposal criticProposal = new()
        {
            SourceAgent = AgentType.Critic,
            AddedRelationships =
            [
                null!,
                new ManifestRelationship
                {
                    SourceId = "svc-api",
                    TargetId = "svc-api",
                    RelationshipType = RelationshipType.Calls,
                },
            ],
        };

        List<AgentResult> results =
        [
            new AgentResult
            {
                RunId = "run-1",
                TaskId = "topology-task",
                AgentType = AgentType.Topology,
                ProposedChanges = primaryTopology,
            },
            new AgentResult
            {
                RunId = "run-1",
                TaskId = "critic-task",
                AgentType = AgentType.Critic,
                ProposedChanges = criticProposal,
            },
        ];

        TopologyProposalDualModelConsensusEnricher consensus = CreateConsensusEnricher(secondaryTopology);

        Func<Task> act = async () => await consensus.EnrichAsync(
            "run-1",
            new ArchitectureRequest { RequestId = "req", Description = new string('x', 12) },
            new AgentEvidencePackage(),
            results,
            CancellationToken.None);

        await act.Should().NotThrowAsync();
        AgentTopologyProposal criticAfter = (AgentTopologyProposal)results[1].ProposedChanges!;
        criticAfter.AddedRelationships.Should().ContainSingle();
    }

    [Fact]
    public async Task EnrichAsync_skips_null_result_entries_when_resolving_topology_row()
    {
        AgentTopologyProposal primaryTopology = new()
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
                },
            ],
        };

        AgentTopologyProposal secondaryTopology = new()
        {
            SourceAgent = AgentType.Topology,
            AddedServices = primaryTopology.AddedServices,
        };

        List<AgentResult> results =
        [
            null!,
            new AgentResult
            {
                RunId = "run-1",
                TaskId = "topology-task",
                AgentType = AgentType.Topology,
                ProposedChanges = primaryTopology,
            },
        ];

        TopologyProposalDualModelConsensusEnricher consensus = CreateConsensusEnricher(secondaryTopology);

        Func<Task> act = async () => await consensus.EnrichAsync(
            "run-1",
            new ArchitectureRequest { RequestId = "req", Description = new string('x', 12) },
            new AgentEvidencePackage(),
            results,
            CancellationToken.None);

        await act.Should().NotThrowAsync();
        AgentTopologyProposal topologyAfter = (AgentTopologyProposal)results[1].ProposedChanges!;
        topologyAfter.AddedServices.Should().ContainSingle().Which.ServiceId.Should().Be("svc-api");
    }

    private static TopologyProposalDualModelConsensusEnricher CreateConsensusEnricher(
        AgentTopologyProposal secondaryTopology)
    {
        Mock<ITopologyProposalSecondaryCompletionInvoker> secondary = new(MockBehavior.Strict);
        secondary
            .Setup(invoker => invoker.InvokeSecondaryAsync(
                It.IsAny<string>(),
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<AgentEvidencePackage>(),
                It.IsAny<AgentTask>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(secondaryTopology);

        Mock<IAuditService> audit = new(MockBehavior.Loose);
        Mock<IScopeContextProvider> scope = new(MockBehavior.Strict);
        scope.Setup(provider => provider.GetCurrentScope()).Returns(new ScopeContext());

        IOptions<TopologyProposalConsensusOptions> options = Options.Create(
            new TopologyProposalConsensusOptions { Enabled = true });

        return new TopologyProposalDualModelConsensusEnricher(
            secondary.Object,
            audit.Object,
            scope.Object,
            options,
            NullLogger<TopologyProposalDualModelConsensusEnricher>.Instance);
    }
}
