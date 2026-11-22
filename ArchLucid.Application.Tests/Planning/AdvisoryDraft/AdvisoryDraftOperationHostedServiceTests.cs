using ArchLucid.Application.Operations;
using ArchLucid.Application.Planning;
using ArchLucid.Application.Planning.AdvisoryDraft;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Scoping;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

using Moq;

namespace ArchLucid.Application.Tests.Planning.AdvisoryDraft;

[Trait("Category", "Unit")]
public sealed class AdvisoryDraftOperationHostedServiceTests
{
    [Fact]
    public async Task Stopping_worker_persists_cancellation_for_running_draft()
    {
        using CancellationTokenSource deadline = new(TimeSpan.FromSeconds(5));
        const string operationId = "draft-operation";
        ScopeContext scope = new() { TenantId = Guid.NewGuid() };
        AdvisoryDraftOperationQueue queue = new();
        TaskCompletionSource started = new(TaskCreationOptions.RunContinuationsAsynchronously);
        bool canceled = false;

        Mock<IAdvisoryDraftOperationStore> store = new();
        store.Setup(item => item.MarkRunningAsync(scope, operationId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        store.Setup(item => item.MarkCanceledAsync(scope, operationId, It.IsAny<CancellationToken>()))
            .Returns((ScopeContext workScope, string id, CancellationToken token) =>
            {
                token.ThrowIfCancellationRequested();
                canceled = true;
                return Task.CompletedTask;
            });

        Mock<IArchitectureRequestDraftService> drafter = new();
        drafter.Setup(service => service.DraftAsync(
                It.IsAny<DraftArchitectureRequestInput>(),
                It.IsAny<CancellationToken>(),
                It.IsAny<IArchitectureRequestDraftProgress?>()))
            .Returns(async (DraftArchitectureRequestInput input, CancellationToken token, IArchitectureRequestDraftProgress? progress) =>
            {
                started.TrySetResult();
                await Task.Delay(Timeout.InfiniteTimeSpan, token);
                throw new InvalidOperationException("The draft should stop with the host.");
            });

        using ServiceProvider services = new ServiceCollection().AddSingleton(drafter.Object).BuildServiceProvider();
        using AdvisoryDraftOperationHostedService worker = new(
            queue,
            services.GetRequiredService<IServiceScopeFactory>(),
            store.Object,
            Mock.Of<IOperationCancellationRegistry>(),
            NullLogger<AdvisoryDraftOperationHostedService>.Instance);

        await queue.EnqueueAsync(new AdvisoryDraftOperationWorkItem
        {
            OperationId = operationId,
            Scope = scope,
            Input = new DraftArchitectureRequestInput(),
        }, deadline.Token);

        await worker.StartAsync(deadline.Token);
        await started.Task.WaitAsync(deadline.Token);
        await worker.StopAsync(deadline.Token);

        Assert.True(canceled);
    }
}
