using ArchLucid.Application.Architecture;
using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Planning;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Tests.Orchestration;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Architecture;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureSynthesisKernelPriorRunCollisionTests
{
    [Fact]
    public async Task GenerateAsync_forwards_prior_run_id_to_workspace_name_collision_guard()
    {
        Guid priorRunId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        ArchitectureRequest request = new()
        {
            RequestId = "req-synth-rerun",
            SystemName = "ArchLucid",
            Description = "Rerun synthesis with same system name",
            WorkflowIntent = ArchitectureWorkflowIntent.CreateArchitecture,
            PriorRunId = priorRunId.ToString("N"),
        };

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        Mock<IRequestContentSafetyPrecheck> safety = new();
        safety
            .Setup(s => s.EvaluateAsync(request, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RequestContentSafetyResult { IsAllowed = true });

        Mock<IArchitectureRequestRepository> requests = new();
        requests
            .Setup(r => r.GetByIdAsync(request.RequestId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((ArchitectureRequest?)null);

        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.SaveAsync(
                It.IsAny<RunRecord>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<System.Data.IDbConnection?>(),
                It.IsAny<System.Data.IDbTransaction?>()))
            .Returns(Task.CompletedTask);

        Mock<IWorkspaceSystemNameCollisionGuard> collisionGuard = new();
        collisionGuard
            .Setup(g => g.EnsureAvailableAsync(
                scope,
                request.SystemName,
                null,
                priorRunId,
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ArchitectureSynthesisKernel sut = new(
            Mock.Of<IArchitectureRequestDraftService>(),
            requests.Object,
            runs.Object,
            scopeProvider.Object,
            safety.Object,
            collisionGuard.Object,
            new ArchitectureKnowledgeModelIntakeBuilder(TimeProvider.System),
            null,
            TechnologyLedgerSeederTestDoubles.CreateRequestSeeder(
                Mock.Of<ITechnologyLedgerRepository>()),
            TechnologyLedgerSeederTestDoubles.CreateEvidenceSeeder(
                Mock.Of<ITechnologyLedgerRepository>(),
                scopeProvider.Object),
            null,
            NullLogger<ArchitectureSynthesisKernel>.Instance,
            TimeProvider.System);

        await sut.GenerateAsync(request, idempotency: null, CancellationToken.None);

        collisionGuard.Verify(
            g => g.EnsureAvailableAsync(
                scope,
                request.SystemName,
                null,
                priorRunId,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
