using ArchLucid.Application.Analysis;
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

    [Fact]
    public async Task CompareQuality_SeedFromTopologyResultAsync_does_not_cold_start_second_chosen_cloud_platform_when_user_row_uses_legacy_run_id_key()
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

        Guid runGuid = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        string runId = runGuid.ToString("N");
        string legacyUpper = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runId).ToUpperInvariant();

        await ledgerRepository.AddAsync(
            new TechnologyLedgerEntry
            {
                RunId = legacyUpper,
                Role = TechnologyLedgerRole.CloudPlatform,
                TechnologyName = "Microsoft Azure",
                ProviderFamily = CloudProvider.Azure,
                Status = TechnologyLedgerStatus.Chosen,
                Source = TechnologyLedgerSource.User,
                CreatedUtc = DateTime.UtcNow,
                UpdatedUtc = DateTime.UtcNow,
            },
            CancellationToken.None);

        TechnologyLedgerTopologyProposalSeeder seeder =
            TechnologyLedgerSeederTestDoubles.CreateTopologyProposalSeeder(ledgerRepository, scopeProvider.Object);

        ArchitectureRequest request = new()
        {
            RequestId = "r-legacy",
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
                ProposalId = "p-legacy",
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
            await AnalysisRunIdCanonicalization.LoadTechnologyLedgerEntriesByRunIdAsync(
                ledgerRepository,
                scope,
                runId,
                CancellationToken.None);

        entries.Should().ContainSingle(entry =>
            entry.Role == TechnologyLedgerRole.CloudPlatform
            && entry.Status == TechnologyLedgerStatus.Chosen
            && entry.Source == TechnologyLedgerSource.User);
    }
}
