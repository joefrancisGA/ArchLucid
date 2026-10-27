using ArchLucid.Application.Analysis;
using ArchLucid.Application.Evidence;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Execute;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.AgentEvaluation;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Orchestration.Execute;

[Trait("Category", "Unit")]
public sealed class AgentLoopPrepareStageLegacyRunIdTests
{
    [Fact]
    public async Task CompareQuality_PrepareAsync_loads_tasks_when_stored_under_legacy_run_id_key()
    {
        Guid runGuid = Guid.Parse("12121212-1212-1212-1212-121212121212");
        string runIdN = runGuid.ToString("N");
        string legacyUpper = AnalysisRunIdCanonicalization.CanonicalRunIdForLookup(runIdN).ToUpperInvariant();

        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        ArchitectureRequest request = new()
        {
            RequestId = "req-prepare-legacy",
            Description = "long enough text",
            SystemName = "PrepareLegacy",
            CloudProvider = CloudProvider.Azure,
        };

        Mock<IArchitectureRequestRepository> requestRepository = new();
        requestRepository
            .Setup(r => r.GetByIdAsync(request.RequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(request);

        Mock<IRequestContentSafetyPrecheck> safety = new();
        safety
            .Setup(s => s.EvaluateAsync(request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });

        InMemoryAgentTaskRepository taskRepository = new();
        await taskRepository.CreateManyAsync(
            [
                new AgentTask
                {
                    TaskId = "legacy-prepare-task",
                    RunId = legacyUpper,
                    AgentType = AgentType.Topology,
                    CreatedUtc = DateTime.UtcNow,
                },
            ],
            CancellationToken.None);

        Mock<IEvidenceBuilder> evidenceBuilder = new();
        evidenceBuilder
            .Setup(b => b.BuildAsync(runIdN, request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new AgentEvidencePackage());

        AgentLoopPrepareStage sut = new(
            requestRepository.Object,
            safety.Object,
            scopeProvider.Object,
            Mock.Of<IRunRepository>(),
            Mock.Of<IRunGovernanceScopePinService>(),
            taskRepository,
            evidenceBuilder.Object,
            new NoOpEvidencePackageInjectionMitigator(),
            new NoOpAgentEvidenceUntrustedInputSanitizer(),
            NullLogger<AgentLoopPrepareStage>.Instance);

        ArchitectureRun run = new()
        {
            RunId = runIdN,
            RequestId = request.RequestId,
        };

        AgentLoopPreparedBatch batch = await sut.PrepareAsync(run, runIdN, "actor", CancellationToken.None);

        batch.Tasks.Should().ContainSingle(task => task.TaskId == "legacy-prepare-task");
        batch.GovernanceScope.Dispose();
    }
}
