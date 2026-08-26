using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Manifest;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Orchestration;

[Trait("Suite", "Core")]
public sealed class TechnologyLedgerTopologyProposalSeederTests
{
    [SkippableFact]
    public async Task SeedFromTopologyResultAsync_persists_agent_proposed_rows()
    {
        InMemoryTechnologyLedgerRepository ledgerRepository = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        TechnologyLedgerTopologyProposalSeeder seeder =
            TechnologyLedgerSeederTestDoubles.CreateTopologyProposalSeeder(ledgerRepository, scopeProvider.Object);

        string runId = Guid.NewGuid().ToString("N");
        ArchitectureRequest request = new()
        {
            RequestId = "r1",
            SystemName = "Sys",
            Description = "desc",
            CloudProvider = CloudProvider.Azure,
        };

        AgentResult topologyResult = new()
        {
            RunId = runId,
            AgentType = AgentType.Topology,
            ProposedChanges = new AgentTopologyProposal
            {
                ProposalId = "p1",
                AddedServices =
                [
                    new ManifestService
                    {
                        ServiceId = "svc-api",
                        ServiceName = "api",
                        ServiceType = ServiceType.Api,
                        RuntimePlatform = RuntimePlatform.AppService,
                    },
                ],
            },
        };

        await seeder.SeedFromTopologyResultAsync(runId, request, topologyResult, CancellationToken.None);

        IReadOnlyList<TechnologyLedgerEntry> entries =
            await ledgerRepository.GetByRunIdAsync(scope, runId, CancellationToken.None);

        entries.Should().Contain(entry =>
            entry.Role == TechnologyLedgerRole.CloudPlatform
            && entry.Source == TechnologyLedgerSource.AgentProposed
            && entry.Status == TechnologyLedgerStatus.Chosen);
    }
}
