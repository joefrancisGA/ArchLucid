using ArchLucid.Application.Runs.Async;
using ArchLucid.Application.Runs.Async.Workers;
using ArchLucid.Core.Scoping;
using ArchLucid.TestSupport;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Runs.Async;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureRunAsyncOperationCreateCompletionWorkerTests
{
    private static readonly ScopeContext DefaultScope = new()
    {
        TenantId = ScopeIds.DefaultTenant,
        WorkspaceId = ScopeIds.DefaultWorkspace,
        ProjectId = ScopeIds.DefaultProject
    };

    [Fact]
    public async Task Canceled_slot_wait_records_create_failure_and_releases_registration()
    {
        ArchitectureRunAsyncOperationCreateCompletionWorker worker = new();
        ArchitectureRunAsyncOperationRegistrar registrar = new();
        ArchitectureRunAsyncOperationWorkItem create = ExecuteItem(Guid.NewGuid()) with
        {
            Kind = ArchitectureRunAsyncOperationKind.Create,
        };
        registrar.TryRegister(create.Scope, create.RunId, create.Kind).Should().BeTrue();
        using CancellationTokenSource shutdown = new();
        shutdown.Cancel();
        bool failureRecorded = false;

        Func<Task> dispatch = () => worker.ProcessCreateBoundedAsync(
            create,
            (_, _) => throw new InvalidOperationException("Create should not run after shutdown."),
            (_, cleanupToken) =>
            {
                cleanupToken.ThrowIfCancellationRequested();
                failureRecorded = true;
                return Task.CompletedTask;
            },
            registrar,
            shutdown.Token);

        await dispatch.Should().ThrowAsync<OperationCanceledException>();
        failureRecorded.Should().BeTrue();
        registrar.IsRegistered(create.Scope, create.RunId, create.Kind).Should().BeFalse();
    }

    [Fact]
    public async Task WaitForCreateIfNeededAsync_returns_immediately_when_create_is_not_registered()
    {
        ArchitectureRunAsyncOperationCreateCompletionWorker sut = new(TimeSpan.FromMilliseconds(20));
        ArchitectureRunAsyncOperationRegistrar registrar = new();
        ArchitectureRunAsyncOperationWorkItem execute = ExecuteItem(Guid.NewGuid());

        await sut.WaitForCreateIfNeededAsync(execute, registrar, CancellationToken.None);
    }

    [Fact]
    public async Task Execute_waits_for_the_current_create_registration()
    {
        ArchitectureRunAsyncOperationCreateCompletionWorker worker = new();
        ArchitectureRunAsyncOperationRegistrar registrar = new();
        ArchitectureRunAsyncOperationWorkItem execute = ExecuteItem(Guid.NewGuid());
        ArchitectureRunAsyncOperationWorkItem create = execute with { Kind = ArchitectureRunAsyncOperationKind.Create };
        registrar.TryRegister(create.Scope, create.RunId, create.Kind).Should().BeTrue();

        await worker.ProcessCreateBoundedAsync(
            create,
            (item, _) =>
            {
                registrar.Release(item.Scope, item.RunId, item.Kind);
                return Task.CompletedTask;
            },
            (_, _) => Task.CompletedTask,
            registrar,
            CancellationToken.None);

        registrar.TryRegister(create.Scope, create.RunId, create.Kind).Should().BeTrue();
        Task secondWait = worker.WaitForCreateIfNeededAsync(execute, registrar, CancellationToken.None);

        secondWait.IsCompleted.Should().BeFalse();
        registrar.Release(create.Scope, create.RunId, create.Kind);
        await secondWait.WaitAsync(TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task WaitForCreateIfNeededAsync_times_out_when_create_stays_registered()
    {
        ArchitectureRunAsyncOperationCreateCompletionWorker sut = new(TimeSpan.FromMilliseconds(40));
        ArchitectureRunAsyncOperationRegistrar registrar = new();
        Guid runId = Guid.NewGuid();
        registrar.TryRegister(DefaultScope, runId.ToString("D"), ArchitectureRunAsyncOperationKind.Create);
        ArchitectureRunAsyncOperationWorkItem execute = ExecuteItem(runId);
        System.Diagnostics.Stopwatch elapsed = System.Diagnostics.Stopwatch.StartNew();

        await sut.WaitForCreateIfNeededAsync(execute, registrar, CancellationToken.None);

        elapsed.Stop();
        elapsed.Elapsed.Should().BeLessThan(TimeSpan.FromSeconds(2));
        elapsed.Elapsed.Should().BeGreaterThanOrEqualTo(TimeSpan.FromMilliseconds(20));
    }

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
