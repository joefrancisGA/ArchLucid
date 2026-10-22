using ArchLucid.Application;
using ArchLucid.Application.Operations;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Async;
using ArchLucid.Application.Runs.Async.Workers;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.TestSupport;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Async;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureRunAsyncOperationHostedServiceTests
{
    private static readonly ScopeContext DefaultScope = new()
    {
        TenantId = ScopeIds.DefaultTenant,
        WorkspaceId = ScopeIds.DefaultWorkspace,
        ProjectId = ScopeIds.DefaultProject
    };

    [Fact]
    public async Task Create_is_processed_while_execute_is_still_running()
    {
        TaskCompletionSource executeEntered = new(TaskCreationOptions.RunContinuationsAsynchronously);
        TaskCompletionSource executeRelease = new(TaskCreationOptions.RunContinuationsAsynchronously);
        TaskCompletionSource createStarted = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Mock<IArchitectureRunExecuteOrchestrator> execute = new();
        execute
            .Setup(e => e.ExecuteRunAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(async (string _, CancellationToken ct) =>
            {
                executeEntered.TrySetResult();
                await executeRelease.Task.WaitAsync(ct);

                return new ExecuteRunResult();
            });
        Mock<IArchitectureRunCreateOrchestrator> create = new();
        create
            .Setup(c => c.CompleteAsyncAcceptedCreateRunAsync(
                It.IsAny<Guid>(),
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<CreateRunIdempotencyState?>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<string?>()))
            .Returns(() =>
            {
                createStarted.TrySetResult();

                return Task.CompletedTask;
            });

        ArchitectureRunAsyncOperationQueue queue = new();
        ArchitectureRunAsyncOperationRegistrar registrar = new();
        using ArchitectureRunAsyncOperationHostedService sut = CreateSut(
            queue,
            registrar,
            create.Object,
            execute.Object);

        Guid executeRunId = Guid.NewGuid();
        Guid createRunId = Guid.NewGuid();
        registrar.TryRegister(DefaultScope, executeRunId.ToString("D"), ArchitectureRunAsyncOperationKind.Execute)
            .Should()
            .BeTrue();
        registrar.TryRegister(DefaultScope, createRunId.ToString("N"), ArchitectureRunAsyncOperationKind.Create)
            .Should()
            .BeTrue();

        await sut.StartAsync(CancellationToken.None);

        try
        {
            await queue.EnqueueAsync(ExecuteItem(executeRunId), CancellationToken.None);
            await executeEntered.Task.WaitAsync(TimeSpan.FromSeconds(5));
            await queue.EnqueueAsync(CreateItem(createRunId), CancellationToken.None);
            await createStarted.Task.WaitAsync(TimeSpan.FromSeconds(5));
        }
        finally
        {
            executeRelease.TrySetResult();
            await sut.StopAsync(CancellationToken.None);
        }

        create.Verify(
            c => c.CompleteAsyncAcceptedCreateRunAsync(
                createRunId,
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<CreateRunIdempotencyState?>(),
                It.IsAny<CancellationToken>(),
                "actor"),
            Times.Once);
    }

    [Fact]
    public async Task Execute_waits_until_same_run_create_completes()
    {
        TaskCompletionSource createHold = new(TaskCreationOptions.RunContinuationsAsynchronously);
        TaskCompletionSource executeStarted = new(TaskCreationOptions.RunContinuationsAsynchronously);
        Mock<IArchitectureRunCreateOrchestrator> create = new();
        create
            .Setup(c => c.CompleteAsyncAcceptedCreateRunAsync(
                It.IsAny<Guid>(),
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<CreateRunIdempotencyState?>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<string?>()))
            .Returns((Guid _, ArchitectureRequest _, CreateRunIdempotencyState? _, CancellationToken ct, string? _) =>
                createHold.Task.WaitAsync(ct));
        Mock<IArchitectureRunExecuteOrchestrator> execute = new();
        execute
            .Setup(e => e.ExecuteRunAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(() =>
            {
                executeStarted.TrySetResult();

                return Task.FromResult(new ExecuteRunResult());
            });

        ArchitectureRunAsyncOperationQueue queue = new();
        ArchitectureRunAsyncOperationRegistrar registrar = new();
        using ArchitectureRunAsyncOperationHostedService sut = CreateSut(
            queue,
            registrar,
            create.Object,
            execute.Object);

        Guid runId = Guid.NewGuid();
        registrar.TryRegister(DefaultScope, runId.ToString("N"), ArchitectureRunAsyncOperationKind.Create)
            .Should()
            .BeTrue();
        registrar.TryRegister(DefaultScope, runId.ToString("D"), ArchitectureRunAsyncOperationKind.Execute)
            .Should()
            .BeTrue();

        await sut.StartAsync(CancellationToken.None);

        try
        {
            await queue.EnqueueAsync(CreateItem(runId), CancellationToken.None);
            await queue.EnqueueAsync(ExecuteItem(runId), CancellationToken.None);
            await Task.Delay(200);
            executeStarted.Task.IsCompleted.Should().BeFalse();
            createHold.TrySetResult();
            await executeStarted.Task.WaitAsync(TimeSpan.FromSeconds(5));
        }
        finally
        {
            createHold.TrySetResult();
            await sut.StopAsync(CancellationToken.None);
        }
    }

    [Fact]
    public async Task Create_failure_marks_run_failed()
    {
        Guid runId = Guid.NewGuid();
        Mock<IArchitectureRunCreateOrchestrator> create = new();
        create
            .Setup(c => c.CompleteAsyncAcceptedCreateRunAsync(
                It.IsAny<Guid>(),
                It.IsAny<ArchitectureRequest>(),
                It.IsAny<CreateRunIdempotencyState?>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<string?>()))
            .ThrowsAsync(new InvalidOperationException("coordination exploded"));
        Mock<IRunRepository> runs = new();
        runs
            .Setup(r => r.GetByIdAsync(DefaultScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new RunRecord
            {
                RunId = runId,
                LegacyRunStatus = nameof(ArchLucid.Contracts.Common.ArchitectureRunStatus.Created)
            });
        TaskCompletionSource updated = new(TaskCreationOptions.RunContinuationsAsynchronously);
        runs
            .Setup(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>(), null, null))
            .Callback(() => updated.TrySetResult())
            .Returns(Task.CompletedTask);

        ArchitectureRunAsyncOperationQueue queue = new();
        ArchitectureRunAsyncOperationRegistrar registrar = new();
        registrar.TryRegister(DefaultScope, runId.ToString("N"), ArchitectureRunAsyncOperationKind.Create);

        using ArchitectureRunAsyncOperationHostedService sut = CreateSut(
            queue,
            registrar,
            create.Object,
            Mock.Of<IArchitectureRunExecuteOrchestrator>(),
            runs.Object);

        await sut.StartAsync(CancellationToken.None);
        await queue.EnqueueAsync(CreateItem(runId), CancellationToken.None);
        await updated.Task.WaitAsync(TimeSpan.FromSeconds(5));
        await sut.StopAsync(CancellationToken.None);

        runs.Verify(
            r => r.UpdateAsync(
                It.Is<RunRecord>(row =>
                    row.RunId == runId
                    && row.LegacyRunStatus == nameof(ArchLucid.Contracts.Common.ArchitectureRunStatus.Failed)),
                It.IsAny<CancellationToken>(),
                null,
                null),
            Times.Once);
    }

    [Fact]
    public async Task Execute_for_second_run_starts_while_first_execute_is_still_running()
    {
        TaskCompletionSource firstEntered = new(TaskCreationOptions.RunContinuationsAsynchronously);
        TaskCompletionSource firstRelease = new(TaskCreationOptions.RunContinuationsAsynchronously);
        TaskCompletionSource secondStarted = new(TaskCreationOptions.RunContinuationsAsynchronously);
        int started = 0;
        Mock<IArchitectureRunExecuteOrchestrator> execute = new();
        execute
            .Setup(e => e.ExecuteRunAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .Returns(async (string _, CancellationToken ct) =>
            {
                int order = Interlocked.Increment(ref started);

                if (order == 1)
                {
                    firstEntered.TrySetResult();
                    await firstRelease.Task.WaitAsync(ct);
                }
                else
                {
                    secondStarted.TrySetResult();
                }

                return new ExecuteRunResult();
            });

        ArchitectureRunAsyncOperationQueue queue = new();
        ArchitectureRunAsyncOperationRegistrar registrar = new();
        using ArchitectureRunAsyncOperationHostedService sut = CreateSut(
            queue,
            registrar,
            Mock.Of<IArchitectureRunCreateOrchestrator>(),
            execute.Object);

        Guid firstRunId = Guid.NewGuid();
        Guid secondRunId = Guid.NewGuid();
        registrar.TryRegister(DefaultScope, firstRunId.ToString("D"), ArchitectureRunAsyncOperationKind.Execute)
            .Should()
            .BeTrue();
        registrar.TryRegister(DefaultScope, secondRunId.ToString("D"), ArchitectureRunAsyncOperationKind.Execute)
            .Should()
            .BeTrue();

        await sut.StartAsync(CancellationToken.None);

        try
        {
            await queue.EnqueueAsync(ExecuteItem(firstRunId), CancellationToken.None);
            await firstEntered.Task.WaitAsync(TimeSpan.FromSeconds(5));
            await queue.EnqueueAsync(ExecuteItem(secondRunId), CancellationToken.None);
            await secondStarted.Task.WaitAsync(TimeSpan.FromSeconds(5));
        }
        finally
        {
            firstRelease.TrySetResult();
            await sut.StopAsync(CancellationToken.None);
        }

        started.Should().Be(2);
    }

    [Fact]
    public async Task Execute_failure_persists_failed_status_with_fresh_completed_utc()
    {
        Guid runId = Guid.NewGuid();
        DateTime previousCompleted = new(2026, 9, 5, 17, 12, 13, DateTimeKind.Utc);
        Mock<IArchitectureRunExecuteOrchestrator> execute = new();
        execute
            .Setup(e => e.ExecuteRunAsync(It.IsAny<string>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ConflictException("Run execute is already owned by another host instance."));
        Mock<IRunRepository> runs = new();
        RunRecord header = new()
        {
            RunId = runId,
            LegacyRunStatus = nameof(ArchLucid.Contracts.Common.ArchitectureRunStatus.Retrying),
            CompletedUtc = previousCompleted
        };
        runs
            .Setup(r => r.GetByIdAsync(DefaultScope, runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);
        TaskCompletionSource updated = new(TaskCreationOptions.RunContinuationsAsynchronously);
        runs
            .Setup(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>(), null, null))
            .Callback<RunRecord, CancellationToken, System.Data.IDbConnection?, System.Data.IDbTransaction?>(
                (row, _, _, _) =>
                {
                    if (row.LegacyRunStatus == nameof(ArchLucid.Contracts.Common.ArchitectureRunStatus.Failed))
                        updated.TrySetResult();
                })
            .Returns(Task.CompletedTask);

        ArchitectureRunAsyncOperationQueue queue = new();
        ArchitectureRunAsyncOperationRegistrar registrar = new();
        registrar.TryRegister(DefaultScope, runId.ToString("D"), ArchitectureRunAsyncOperationKind.Execute);

        using ArchitectureRunAsyncOperationHostedService sut = CreateSut(
            queue,
            registrar,
            Mock.Of<IArchitectureRunCreateOrchestrator>(),
            execute.Object,
            runs.Object);

        await sut.StartAsync(CancellationToken.None);
        await queue.EnqueueAsync(ExecuteItem(runId), CancellationToken.None);
        await updated.Task.WaitAsync(TimeSpan.FromSeconds(5));
        await sut.StopAsync(CancellationToken.None);

        header.LegacyRunStatus.Should().Be(nameof(ArchLucid.Contracts.Common.ArchitectureRunStatus.Failed));
        header.CompletedUtc.Should().NotBeNull();
        header.CompletedUtc.Should().BeAfter(previousCompleted);
        header.LastFailureReason.Should().Contain("invalidOperation");
    }

    private static ArchitectureRunAsyncOperationHostedService CreateSut(
        ArchitectureRunAsyncOperationQueue queue,
        ArchitectureRunAsyncOperationRegistrar registrar,
        IArchitectureRunCreateOrchestrator create,
        IArchitectureRunExecuteOrchestrator execute,
        IRunRepository? runs = null)
    {
        ServiceCollection services = new();
        services.AddSingleton(create);
        services.AddSingleton(execute);
        services.AddSingleton(Mock.Of<IReplayRunService>());
        services.AddSingleton<IOperationCancellationRegistry>(new OperationCancellationRegistry());

        if (runs is null)
        {
            Mock<IRunRepository> runRepo = new();
            runRepo
                .Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
                .ReturnsAsync((ScopeContext scope, Guid id, CancellationToken _) => new RunRecord
                {
                    RunId = id,
                    TenantId = scope.TenantId,
                    WorkspaceId = scope.WorkspaceId,
                    ScopeProjectId = scope.ProjectId,
                    ProjectId = scope.ProjectId.ToString("N"),
                    LegacyRunStatus = nameof(ArchLucid.Contracts.Common.ArchitectureRunStatus.Created)
                });
            services.AddSingleton(runRepo.Object);
        }
        else
        {
            services.AddSingleton(runs);
        }

        services.AddSingleton<OperationRunCancellationMarker>();
        ServiceProvider provider = services.BuildServiceProvider();

        return new ArchitectureRunAsyncOperationHostedService(
            new ArchitectureRunAsyncOperationQueueDrainWorker(queue),
            new ArchitectureRunAsyncOperationCreateCompletionWorker(),
            new ArchitectureRunAsyncOperationExecuteReplayWorker(),
            provider.GetRequiredService<IServiceScopeFactory>(),
            registrar,
            provider.GetRequiredService<IOperationCancellationRegistry>(),
            NullLogger<ArchitectureRunAsyncOperationHostedService>.Instance);
    }

    private static ArchitectureRunAsyncOperationWorkItem CreateItem(Guid runId) =>
        new(
            ArchitectureRunAsyncOperationKind.Create,
            DefaultScope,
            "actor",
            "corr",
            runId.ToString("N"),
            ReplayExecutionMode: null,
            ReplayCommit: false,
            ReplayManifestVersionOverride: null,
            PreparedReplayRunId: null,
            CreateRequest: new ArchitectureRequest
            {
                RequestId = "req-" + runId.ToString("N")[..8],
                Description = "Hosted create dispatch.",
                SystemName = "Sys",
                Environment = "prod"
            });

    private static ArchitectureRunAsyncOperationWorkItem ExecuteItem(Guid runId) =>
        new(
            ArchitectureRunAsyncOperationKind.Execute,
            DefaultScope,
            "actor",
            "corr",
            runId.ToString("D"),
            ReplayExecutionMode: null,
            ReplayCommit: false,
            ReplayManifestVersionOverride: null,
            PreparedReplayRunId: null);
}
