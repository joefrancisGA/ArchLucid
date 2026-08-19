using ArchLucid.Application.Runs.Coordination;
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
}
