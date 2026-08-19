using ArchLucid.Application.Jobs;
using ArchLucid.Host.Composition.AzureOpenAI;
using ArchLucid.Host.Composition.Jobs;
using ArchLucid.Host.Core.Jobs;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Host.Composition.Tests;

/// <summary>
///     RC28 package-coverage batch: background-job cancellation writers and fallback Azure OpenAI client registry dispose.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class HostCompositionPackageCoverageBatchRc28Tests
{
    [Fact]
    public void BackgroundJobCancellationWriter_rejects_null_queue()
    {
        FluentActions
            .Invoking(() => _ = new BackgroundJobCancellationWriter(null!))
            .Should()
            .Throw<ArgumentNullException>()
            .WithParameterName("queue");
    }

    [Fact]
    public async Task BackgroundJobCancellationWriter_MarkCanceledAsync_forwards_to_queue()
    {
        Mock<IBackgroundJobQueue> queue = new();
        queue
            .Setup(q => q.MarkCanceledAsync("job-1", It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        BackgroundJobCancellationWriter sut = new(queue.Object);

        await sut.MarkCanceledAsync("job-1", CancellationToken.None);

        queue.Verify(q => q.MarkCanceledAsync("job-1", CancellationToken.None), Times.Once);
    }

    [Fact]
    public void BackgroundJobRepositoryCancellationWriter_rejects_null_repository()
    {
        FluentActions
            .Invoking(() => _ = new BackgroundJobRepositoryCancellationWriter(null!))
            .Should()
            .Throw<ArgumentNullException>()
            .WithParameterName("repository");
    }

    [Fact]
    public async Task BackgroundJobRepositoryCancellationWriter_MarkCanceledAsync_forwards_to_repository()
    {
        Mock<IBackgroundJobRepository> repository = new();
        repository
            .Setup(r => r.MarkCanceledAsync("job-2", It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        BackgroundJobRepositoryCancellationWriter sut = new(repository.Object);

        await sut.MarkCanceledAsync("job-2", CancellationToken.None);

        repository.Verify(r => r.MarkCanceledAsync("job-2", CancellationToken.None), Times.Once);
    }

    [Fact]
    public void FallbackAzureOpenAiInnerClientsRegistry_Dispose_tolerates_empty_client_list()
    {
        FallbackAzureOpenAiInnerClientsRegistry registry = new()
        {
            Clients = Array.Empty<ArchLucid.AgentRuntime.AzureOpenAiCompletionClient>(),
        };

        FluentActions.Invoking(registry.Dispose).Should().NotThrow();
    }
}
