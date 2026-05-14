using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Requests;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Orchestration;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests.Hosted;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AuthorityPipelineWorkProcessorTests
{
    [Fact]
    public async Task ProcessPendingBatchAsync_when_exception_thrown_dead_letters_after_max_retries()
    {
        Mock<IAuthorityPipelineWorkRepository> outbox = new();
        
        var entry = new AuthorityPipelineWorkOutboxEntry
        {
            OutboxId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            AttemptCount = 0,
            PayloadJson = "{}"
        };

        outbox.Setup(r => r.DequeuePendingAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([entry]);

        // Mock scope factory to return the outbox
        var sp = new ServiceCollection();
        sp.AddSingleton(outbox.Object);
        var provider = sp.BuildServiceProvider();

        Mock<IServiceScope> scope = new();
        scope.Setup(s => s.ServiceProvider).Returns(provider);

        Mock<IServiceScopeFactory> scopeFactory = new();
        scopeFactory.Setup(f => f.CreateScope()).Returns(scope.Object);

        var options = new AuthorityPipelineWorkProcessorOptions
        {
            MaxAttemptsBeforeDeadLetter = 1
        };

        var sut = new AuthorityPipelineWorkProcessor(
            scopeFactory.Object,
            Options.Create(options),
            TimeProvider.System,
            NullLogger<AuthorityPipelineWorkProcessor>.Instance);

        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        outbox.Verify(r => r.RecordDeadLetterAsync(entry.OutboxId, It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
    }
    
    [Fact]
    public async Task ProcessPendingBatchAsync_when_exception_thrown_backs_off_if_retries_remaining()
    {
        Mock<IAuthorityPipelineWorkRepository> outbox = new();
        
        var entry = new AuthorityPipelineWorkOutboxEntry
        {
            OutboxId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            AttemptCount = 0,
            PayloadJson = "{}" // empty json will fail in ProcessEntryAsync
        };

        outbox.Setup(r => r.DequeuePendingAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([entry]);

        var sp = new ServiceCollection();
        sp.AddSingleton(outbox.Object);
        var provider = sp.BuildServiceProvider();

        Mock<IServiceScope> scope = new();
        scope.Setup(s => s.ServiceProvider).Returns(provider);

        Mock<IServiceScopeFactory> scopeFactory = new();
        scopeFactory.Setup(f => f.CreateScope()).Returns(scope.Object);

        var options = new AuthorityPipelineWorkProcessorOptions
        {
            MaxAttemptsBeforeDeadLetter = 3,
            RetryBackoffBaseSeconds = 5
        };

        var sut = new AuthorityPipelineWorkProcessor(
            scopeFactory.Object,
            Options.Create(options),
            TimeProvider.System,
            NullLogger<AuthorityPipelineWorkProcessor>.Instance);

        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        outbox.Verify(r => r.RecordBackoffAfterProcessingFailureAsync(entry.OutboxId, It.IsAny<DateTime>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
        outbox.Verify(r => r.RecordDeadLetterAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Never);
    }
}
