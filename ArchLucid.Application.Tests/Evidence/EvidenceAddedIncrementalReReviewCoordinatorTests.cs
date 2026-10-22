using ArchLucid.Application.ArchitectureIntelligence;
using ArchLucid.Application.Evidence;
using ArchLucid.Contracts.ArchitectureIntelligence;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Persistence.ApplicationPorts.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Evidence;

[Trait("Category", "Unit")]
[Trait("Suite", "Application")]
public sealed class EvidenceAddedIncrementalReReviewCoordinatorTests
{
    private static readonly ScopeContext DefaultScope = new()
    {
        TenantId = ScopeIds.DefaultTenant,
        WorkspaceId = ScopeIds.DefaultWorkspace,
        ProjectId = ScopeIds.DefaultProject
    };

    [Fact]
    public async Task TryScheduleAfterBulkUploadAsync_enqueues_background_work()
    {
        Mock<IScopeContextProvider> scopeContextProvider = new();
        scopeContextProvider.Setup(provider => provider.GetCurrentScope()).Returns(DefaultScope);
        Mock<IEvidenceAddedIncrementalReReviewQueue> queue = new();
        Func<CancellationToken, Task>? captured = null;
        queue
            .Setup(q => q.EnqueueAsync(It.IsAny<Func<CancellationToken, Task>>(), It.IsAny<CancellationToken>()))
            .Callback<Func<CancellationToken, Task>, CancellationToken>((workItem, _) => captured = workItem)
            .Returns(ValueTask.CompletedTask);
        ServiceProvider services = new ServiceCollection().BuildServiceProvider();
        EvidenceAddedIncrementalReReviewCoordinator sut = new(
            scopeContextProvider.Object,
            queue.Object,
            services.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(new IncrementalReReviewOnEvidenceAddedOptions { Enabled = true }),
            NullLogger<EvidenceAddedIncrementalReReviewCoordinator>.Instance);

        await sut.TryScheduleAfterBulkUploadAsync(Guid.NewGuid(), uploadedFileCount: 2, CancellationToken.None);

        queue.Verify(
            q => q.EnqueueAsync(It.IsAny<Func<CancellationToken, Task>>(), It.IsAny<CancellationToken>()),
            Times.Once);
        captured.Should().NotBeNull();
    }

    [Fact]
    public async Task TryScheduleAfterBulkUploadAsync_background_work_runs_incremental_rereview_in_fresh_scope()
    {
        Guid runId = Guid.NewGuid();
        Mock<IScopeContextProvider> scopeContextProvider = new();
        scopeContextProvider.Setup(provider => provider.GetCurrentScope()).Returns(DefaultScope);
        Mock<IEvidenceAddedIncrementalReReviewQueue> queue = new();
        Func<CancellationToken, Task>? captured = null;
        queue
            .Setup(q => q.EnqueueAsync(It.IsAny<Func<CancellationToken, Task>>(), It.IsAny<CancellationToken>()))
            .Callback<Func<CancellationToken, Task>, CancellationToken>((workItem, _) => captured = workItem)
            .Returns(ValueTask.CompletedTask);

        Mock<IRunRepository> runRepository = new();
        runRepository
            .Setup(repository => repository.GetByIdAsync(DefaultScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord { LegacyRunStatus = nameof(ArchitectureRunStatus.ReadyForCommit) });
        Mock<IArchitectureKnowledgeModelAccess> modelAccess = new();
        ArchitectureKnowledgeModel model = new()
        {
            Elements =
            [
                new ArchitectureModelElement
                {
                    ElementId = "element-1",
                    Name = "Element 1"
                }
            ]
        };
        modelAccess
            .Setup(access => access.GetForRunAsync(DefaultScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(model);
        Mock<IIncrementalReReviewService> reReviewService = new();
        reReviewService
            .Setup(service => service.ReReviewAsync(
                model,
                It.IsAny<ReReviewScope>(),
                It.IsAny<IAsyncSpecialistReviewService>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new IncrementalReReviewResult
            {
                SpecialistResults = [new SpecialistReviewResult()]
            });
        Mock<IRunStageOutcomesRepository> runStageOutcomesRepository = new();
        Mock<IAuditService> auditService = new();
        Mock<IAsyncSpecialistReviewService> specialistReviewService = new();

        ServiceProvider services = new ServiceCollection()
            .AddSingleton(runRepository.Object)
            .AddSingleton(modelAccess.Object)
            .AddSingleton(reReviewService.Object)
            .AddSingleton(runStageOutcomesRepository.Object)
            .AddSingleton(auditService.Object)
            .AddSingleton(specialistReviewService.Object)
            .BuildServiceProvider();
        EvidenceAddedIncrementalReReviewCoordinator sut = new(
            scopeContextProvider.Object,
            queue.Object,
            services.GetRequiredService<IServiceScopeFactory>(),
            Options.Create(new IncrementalReReviewOnEvidenceAddedOptions { Enabled = true }),
            NullLogger<EvidenceAddedIncrementalReReviewCoordinator>.Instance);

        await sut.TryScheduleAfterBulkUploadAsync(runId, uploadedFileCount: 2, CancellationToken.None);
        captured.Should().NotBeNull();

        await captured!(CancellationToken.None);

        runStageOutcomesRepository.Verify(
            repository => repository.RecordStageStartedAsync(runId, "incremental-re-review-evidence-added", It.IsAny<DateTime>(), It.IsAny<CancellationToken>()),
            Times.Once);
        reReviewService.Verify(
            service => service.ReReviewAsync(
                model,
                It.Is<ReReviewScope>(scope =>
                    scope.Trigger == ReReviewTrigger.EvidenceAdded
                    && !scope.FullReReview
                    && scope.IncludeGlobalInvariantChecks
                    && scope.AffectedElementIds.SequenceEqual(new[] { "element-1" })),
                specialistReviewService.Object,
                It.IsAny<CancellationToken>()),
            Times.Once);
        auditService.Verify(
            service => service.LogAsync(
                It.Is<AuditEvent>(auditEvent =>
                    auditEvent.EventType == AuditEventTypes.Run.IncrementalReReviewCompleted
                    && auditEvent.RunId == runId
                    && auditEvent.TenantId == DefaultScope.TenantId
                    && auditEvent.WorkspaceId == DefaultScope.WorkspaceId
                    && auditEvent.ProjectId == DefaultScope.ProjectId),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }
}
