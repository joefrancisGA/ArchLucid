using ArchLucid.Application;
using ArchLucid.Application.Architecture;
using ArchLucid.Application.Common;
using ArchLucid.Application.Runs.Coordination;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Authority;
using ArchLucid.Core.Scoping;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Orchestration;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureRunCreateOrchestratorWorkspaceNameCollisionTests
{
    [Fact]
    public async Task CreateRunAsync_forwards_prior_run_id_to_workspace_name_collision_guard()
    {
        Guid priorRunId = Guid.Parse("f1329b7e-5168-4ed2-96aa-03e8fc09eb1b");
        ScopeContext scope = new()
        {
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
        };

        Mock<IScopeContextProvider> scopeContextProvider = new();
        scopeContextProvider.Setup(p => p.GetCurrentScope()).Returns(scope);

        Mock<IActorContext> actorContext = new();
        actorContext.Setup(a => a.GetActor()).Returns("collision-test-actor");

        Mock<IBaselineMutationAuditService> baselineAudit = new();
        baselineAudit
            .Setup(b => b.RecordAsync(
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string>(),
                It.IsAny<string?>(),
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        Mock<IArchitectureRunAuthorityCoordination> coordination = new();
        coordination
            .Setup(c => c.CreateRunAsync(
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<CancellationToken>(),
                null))
            .ReturnsAsync(new CoordinationResult { Errors = ["test stop"] });

        Mock<IWorkspaceSystemNameCollisionGuard> guard = new();
        guard
            .Setup(g => g.EnsureAvailableAsync(
                scope,
                "ArchLucid",
                null,
                priorRunId,
                It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        ArchitectureRunCreateOrchestrator sut = ArchitectureRunCreateOrchestratorTestSupport.CreateOrchestrator(
            coordination.Object,
            scopeContextProvider: scopeContextProvider.Object,
            actorContext: actorContext.Object,
            baselineMutationAudit: baselineAudit.Object,
            workspaceSystemNameCollisionGuard: guard.Object);

        ArchitectureRequest request = new()
        {
            RequestId = Guid.NewGuid().ToString("N"),
            SystemName = "ArchLucid",
            PriorRunId = priorRunId.ToString("N"),
        };

        Func<Task> act = async () => await sut.CreateRunAsync(request, null, CancellationToken.None);

        await act.Should().ThrowAsync<InvalidOperationException>()
            .WithMessage("*CreateRun failed*");

        guard.Verify(
            g => g.EnsureAvailableAsync(
                scope,
                "ArchLucid",
                null,
                priorRunId,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
