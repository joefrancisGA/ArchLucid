using ArchLucid.Application.Common;
using ArchLucid.Application.SecureNow;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.ApplicationPorts.Data.Repositories;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.SecureNow;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.SecureNow;

public sealed class AutomationCollectionRunTriggerTests
{
    [Fact]
    public async Task TriggerCreatesRunAndAuditsActor()
    {
        Mock<ICollectionRunRepository> repository = new();
        Mock<IAutomationRunbookStarter> starter = new();
        Mock<IAuditService> audit = new();
        starter
            .Setup(item => item.StartAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                "architect@example.com",
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        AutomationCollectionRunTrigger service = CreateService(repository, starter, audit);

        CollectionRunTriggerResult result = await service.TriggerAsync("architect@example.com");

        result.Succeeded.Should().BeTrue();
        result.RunId.Should().NotBeNull();
        repository.Verify(item => item.UpsertAsync(
            It.Is<CollectionRun>(run => run.Status == CollectionRunStatus.Running),
            It.IsAny<CancellationToken>()), Times.Once);
        audit.Verify(item => item.LogAsync(
            It.Is<AuditEvent>(eventRecord =>
                eventRecord.EventType == "SecureNow.CollectionRunTriggered" &&
                eventRecord.ActorUserId == "architect@example.com"),
            It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task TriggerReturnsRecentPendingRunWithoutStartingAnother()
    {
        Guid pendingRunId = Guid.NewGuid();
        Mock<ICollectionRunRepository> repository = new();
        repository
            .Setup(item => item.TryGetRecentPendingAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<TimeSpan>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CollectionRun
            {
                RunId = pendingRunId,
                Status = CollectionRunStatus.Running,
            });
        Mock<IAutomationRunbookStarter> starter = new();
        Mock<IAuditService> audit = new();
        AutomationCollectionRunTrigger service = CreateService(repository, starter, audit);

        CollectionRunTriggerResult result = await service.TriggerAsync("architect@example.com");

        result.RunId.Should().Be(pendingRunId);
        result.AlreadyPending.Should().BeTrue();
        starter.VerifyNoOtherCalls();
        audit.VerifyNoOtherCalls();
    }

    private static AutomationCollectionRunTrigger CreateService(
        Mock<ICollectionRunRepository> repository,
        Mock<IAutomationRunbookStarter> starter,
        Mock<IAuditService> audit)
    {
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider
            .Setup(item => item.GetCurrentScope())
            .Returns(new ScopeContext
            {
                TenantId = Guid.NewGuid(),
                WorkspaceId = Guid.NewGuid(),
                ProjectId = Guid.NewGuid(),
            });
        return new AutomationCollectionRunTrigger(repository.Object, starter.Object, scopeProvider.Object, audit.Object);
    }
}
