using ArchLucid.Application.Analysis;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Core.Transactions;
using ArchLucid.Application.Tests.Runs.Coordination;
using ArchLucid.Application.Tests.TestDoubles;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.TechnologyLedger;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Suite", "Core")]
public sealed class ArchitectureRunAuthorityCoordinationTechnologyLedgerTests
{
    [SkippableFact]
    public async Task CreateRunAsync_seeds_ledger_before_topology_objective_uses_provider()
    {
        ArchitectureRequest request = new()
        {
            RequestId = "REQ-LEDGER",
            SystemName = "LedgerSystem",
            Description = "Design a secure AWS system.",
            Environment = "prod",
            CloudProvider = CloudProvider.Aws,
            RequestSource = "draft-intake",
        };

        Mock<IRunRepository> runRepo = new();
        runRepo.Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        InMemoryTechnologyLedgerRepository ledgerRepository = new();
        ArchitectureRunAuthorityCoordination service = ArchitectureRunAuthorityCoordinationTestFactory.Create(
            new FakeAuthorityRunOrchestrator(),
            runRepo.Object,
            scopeProvider.Object,
            ledgerRepository: ledgerRepository);

        CoordinationResult result = await service.CreateRunAsync(request);

        result.Success.Should().BeTrue();
        IReadOnlyList<TechnologyLedgerEntry> entries =
            await ledgerRepository.GetByRunIdAsync(scope, result.Run!.RunId, CancellationToken.None);

        entries.Should().ContainSingle(entry => entry.Role == TechnologyLedgerRole.CloudPlatform);
        entries[0].ProviderFamily.Should().Be(CloudProvider.Aws);

        AgentTask topology = result.Tasks.Single(task => task.AgentType == AgentType.Topology);
        topology.Objective.Should().Contain("AWS");
        topology.Objective.Should().NotContain("Azure");
    }

    [Fact]
    public async Task CompareQuality_CreateRunAsync_topology_objective_uses_legacy_ledger_chosen_cloud_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        string runIdN = runGuid.ToString("N");
        string legacyUpper = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runIdN).ToUpperInvariant();
        DateTime legacyCreatedUtc = DateTime.UtcNow.AddDays(1);

        ArchitectureRequest request = new()
        {
            RequestId = "REQ-LEGACY-LEDGER",
            SystemName = "LedgerSystem",
            Description = "Design a secure system.",
            Environment = "prod",
            CloudProvider = CloudProvider.Azure,
            RequestSource = "draft-intake",
        };

        Mock<IRunRepository> runRepo = new();
        runRepo.Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((RunRecord?)null);

        Mock<IScopeContextProvider> scopeProvider = new();
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        InMemoryTechnologyLedgerRepository ledgerRepository = new();
        await ledgerRepository.AddAsync(
            new TechnologyLedgerEntry
            {
                RunId = legacyUpper,
                Role = TechnologyLedgerRole.CloudPlatform,
                TechnologyName = "Amazon Web Services",
                ProviderFamily = CloudProvider.Aws,
                Status = TechnologyLedgerStatus.Chosen,
                Source = TechnologyLedgerSource.User,
                CreatedUtc = legacyCreatedUtc,
                UpdatedUtc = legacyCreatedUtc,
            },
            CancellationToken.None);

        ArchitectureRunAuthorityCoordination service = ArchitectureRunAuthorityCoordinationTestFactory.Create(
            new FixedRunIdAuthorityRunOrchestrator(runGuid),
            runRepo.Object,
            scopeProvider.Object,
            ledgerRepository: ledgerRepository);

        CoordinationResult result = await service.CreateRunAsync(request);

        result.Success.Should().BeTrue();
        AgentTask topology = result.Tasks.Single(task => task.AgentType == AgentType.Topology);
        topology.Objective.Should().Contain("AWS");
        topology.Objective.Should().NotContain("Azure");
    }

    private sealed class FixedRunIdAuthorityRunOrchestrator(Guid runId) : IAuthorityRunOrchestrator
    {
        public Task<RunRecord> ExecuteAsync(
            ContextIngestionRequest request,
            CancellationToken cancellationToken = default,
            string? evidenceBundleIdForDeferredWork = null,
            IArchLucidUnitOfWork? enlistUnitOfWork = null)
        {
            _ = request;
            _ = cancellationToken;
            _ = evidenceBundleIdForDeferredWork;
            _ = enlistUnitOfWork;

            return Task.FromResult(new RunRecord
            {
                RunId = runId,
                ProjectId = "default",
                Description = "test",
                CreatedUtc = TimeProvider.System.UtcNowDateTime(),
                ContextSnapshotId = Guid.NewGuid(),
                GraphSnapshotId = Guid.NewGuid(),
                FindingsSnapshotId = Guid.NewGuid(),
                GoldenManifestId = Guid.NewGuid(),
                DecisionTraceId = Guid.NewGuid(),
                ArtifactBundleId = Guid.NewGuid(),
            });
        }

        public Task<RunRecord> CompleteQueuedAuthorityPipelineAsync(
            ContextIngestionRequest request,
            CancellationToken cancellationToken = default)
        {
            _ = cancellationToken;
            return ExecuteAsync(request, cancellationToken);
        }
    }
}
