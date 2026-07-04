using ArchLucid.Application.Runs;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.TestSupport;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AgentExecuteIdempotentPersistReconciliationTests
{
    private static readonly ScopeContext TestScope = new()
    {
        TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
        WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
        ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
    };

    [Fact]
    public async Task PersistAgentResultsAsync_skips_insert_for_task_with_skippable_persisted_row()
    {
        string runId = Guid.NewGuid().ToString("N");
        InMemoryAgentResultRepository repository = new(new InMemoryAgentResultEnrichmentRepository());

        AgentResult persisted = new()
        {
            ResultId = "existing-topo",
            TaskId = "task-topo",
            RunId = runId,
            AgentType = AgentType.Topology,
            Claims = ["done"],
            Confidence = 0.9,
        };

        await repository.CreateAsync(persisted, CancellationToken.None);

        AgentResult retryCandidate = new()
        {
            ResultId = "new-topo",
            TaskId = "task-topo",
            RunId = runId,
            AgentType = AgentType.Topology,
            Claims = ["retry"],
            Confidence = 0.9,
        };

        AgentResult newCost = new()
        {
            ResultId = "new-cost",
            TaskId = "task-cost",
            RunId = runId,
            AgentType = AgentType.Cost,
            Claims = ["fresh"],
            Confidence = 0.8,
        };

        await AgentExecuteIdempotentPersistReconciliation.PersistAgentResultsAsync(
            repository,
            TestScope,
            [retryCandidate, newCost],
            CancellationToken.None);

        IReadOnlyList<AgentResult> stored = await repository.GetByRunIdAsync(TestScope, runId, CancellationToken.None);
        stored.Should().HaveCount(2);
        stored.Single(r => r.TaskId == "task-topo").ResultId.Should().Be("existing-topo");
        stored.Single(r => r.TaskId == "task-cost").ResultId.Should().Be("new-cost");
    }

    [Fact]
    public async Task PersistAgentResultsAsync_replaces_degraded_persisted_row()
    {
        string runId = Guid.NewGuid().ToString("N");
        InMemoryAgentResultRepository repository = new(new InMemoryAgentResultEnrichmentRepository());

        AgentResult degraded = new()
        {
            ResultId = "degraded-topo",
            TaskId = "task-topo",
            RunId = runId,
            AgentType = AgentType.Topology,
            Claims = ["placeholder"],
            DegradationReasonCode = AgentHandlerDegradationReasonCodes.CircuitOpen,
        };

        await repository.CreateAsync(degraded, CancellationToken.None);

        AgentResult replacement = new()
        {
            ResultId = "replacement-topo",
            TaskId = "task-topo",
            RunId = runId,
            AgentType = AgentType.Topology,
            Claims = ["recovered"],
            Confidence = 0.7,
        };

        await AgentExecuteIdempotentPersistReconciliation.PersistAgentResultsAsync(
            repository,
            TestScope,
            [replacement],
            CancellationToken.None);

        IReadOnlyList<AgentResult> stored = await repository.GetByRunIdAsync(TestScope, runId, CancellationToken.None);
        stored.Should().ContainSingle();
        stored[0].ResultId.Should().Be("replacement-topo");
        stored[0].Claims.Should().Contain("recovered");
    }

    [Fact]
    public async Task ShouldInsertEvidencePackageAsync_returns_false_when_package_already_exists()
    {
        string runId = Guid.NewGuid().ToString("N");
        Mock<IAgentEvidencePackageRepository> evidenceRepo = new();
        AgentEvidencePackage existing = new() { RunId = runId, EvidencePackageId = "pkg-1" };

        evidenceRepo
            .Setup(r => r.GetByRunIdAsync(runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(existing);

        bool shouldInsert = await AgentExecuteIdempotentPersistReconciliation.ShouldInsertEvidencePackageAsync(
            evidenceRepo.Object,
            new AgentEvidencePackage { RunId = runId, EvidencePackageId = "pkg-2" },
            CancellationToken.None);

        shouldInsert.Should().BeFalse();
    }
}
