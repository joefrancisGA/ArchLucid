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
    public async Task WaitForCreateIfNeededAsync_returns_immediately_when_create_is_not_registered()
    {
        ArchitectureRunAsyncOperationCreateCompletionWorker sut = new(TimeSpan.FromMilliseconds(20));
        ArchitectureRunAsyncOperationRegistrar registrar = new();
        ArchitectureRunAsyncOperationWorkItem execute = ExecuteItem(Guid.NewGuid());

        await sut.WaitForCreateIfNeededAsync(execute, registrar, CancellationToken.None);
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
