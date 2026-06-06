using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Persistence.Models;
using ArchLucid.Persistence.Orchestration;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class AuthorityPipelineWorkProcessorTests
{
    [Fact]
    public async Task ProcessPendingBatchAsync_when_exception_thrown_dead_letters_after_max_retries()
    {
        Mock<IAuthorityPipelineWorkRepository> outbox = new();
        Mock<IAuthorityRunOrchestrator> orchestrator = new();

        FaultCompleteQueuedOrchestrator(orchestrator);

        AuthorityPipelineWorkOutboxEntry entry = CreateEntryWithValidPayload();

        outbox.Setup(r => r.DequeuePendingAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([entry]);

        IServiceProvider provider = BuildProvider(outbox, orchestrator);
        Mock<IServiceScopeFactory> scopeFactory = CreateScopeFactory(provider);

        AuthorityPipelineWorkProcessorOptions options = new()
        {
            MaxAttemptsBeforeDeadLetter = 1,
        };

        AuthorityPipelineWorkProcessor sut = new(
            scopeFactory.Object,
            Options.Create(options),
            TimeProvider.System,
            NullLogger<AuthorityPipelineWorkProcessor>.Instance);

        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        outbox.Verify(
            r => r.RecordDeadLetterAsync(entry.OutboxId, It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ProcessPendingBatchAsync_when_exception_thrown_backs_off_if_retries_remaining()
    {
        Mock<IAuthorityPipelineWorkRepository> outbox = new();
        Mock<IAuthorityRunOrchestrator> orchestrator = new();

        FaultCompleteQueuedOrchestrator(orchestrator);

        AuthorityPipelineWorkOutboxEntry entry = CreateEntryWithValidPayload();

        outbox.Setup(r => r.DequeuePendingAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([entry]);

        IServiceProvider provider = BuildProvider(outbox, orchestrator);
        Mock<IServiceScopeFactory> scopeFactory = CreateScopeFactory(provider);

        AuthorityPipelineWorkProcessorOptions options = new()
        {
            MaxAttemptsBeforeDeadLetter = 3,
            RetryBackoffBaseSeconds = 5,
        };

        AuthorityPipelineWorkProcessor sut = new(
            scopeFactory.Object,
            Options.Create(options),
            TimeProvider.System,
            NullLogger<AuthorityPipelineWorkProcessor>.Instance);

        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        outbox.Verify(
            r => r.RecordBackoffAfterProcessingFailureAsync(
                entry.OutboxId,
                It.IsAny<DateTime>(),
                It.IsAny<string>(),
                It.IsAny<CancellationToken>()),
            Times.Once);
        outbox.Verify(
            r => r.RecordDeadLetterAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ProcessPendingBatchAsync_when_payload_invalid_marks_processed_without_dead_letter()
    {
        Mock<IAuthorityPipelineWorkRepository> outbox = new();
        Mock<IAuthorityRunOrchestrator> orchestrator = new();

        AuthorityPipelineWorkOutboxEntry entry = new()
        {
            OutboxId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            AttemptCount = 0,
            PayloadJson = "{}",
        };

        outbox.Setup(r => r.DequeuePendingAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([entry]);

        IServiceProvider provider = BuildProvider(outbox, orchestrator);
        Mock<IServiceScopeFactory> scopeFactory = CreateScopeFactory(provider);

        AuthorityPipelineWorkProcessor sut = new(
            scopeFactory.Object,
            Options.Create(new AuthorityPipelineWorkProcessorOptions()),
            TimeProvider.System,
            NullLogger<AuthorityPipelineWorkProcessor>.Instance);

        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        outbox.Verify(r => r.MarkProcessedAsync(entry.OutboxId, It.IsAny<CancellationToken>()), Times.Once);
        outbox.Verify(
            r => r.RecordDeadLetterAsync(It.IsAny<Guid>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
        orchestrator.Verify(
            o => o.CompleteQueuedAuthorityPipelineAsync(It.IsAny<ContextIngestionRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ProcessPendingBatchAsync_processes_batch_without_throwing_when_one_entry_fails()
    {
        Mock<IAuthorityPipelineWorkRepository> outbox = new();
        Mock<IAuthorityRunOrchestrator> orchestrator = new();

        FaultCompleteQueuedOrchestrator(orchestrator);

        AuthorityPipelineWorkOutboxEntry poisonEntry = CreateEntryWithValidPayload();
        AuthorityPipelineWorkOutboxEntry invalidEntry = new()
        {
            OutboxId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            AttemptCount = 0,
            PayloadJson = "{}",
        };

        outbox.Setup(r => r.DequeuePendingAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([poisonEntry, invalidEntry]);

        IServiceProvider provider = BuildProvider(outbox, orchestrator);
        Mock<IServiceScopeFactory> scopeFactory = CreateScopeFactory(provider);

        AuthorityPipelineWorkProcessor sut = new(
            scopeFactory.Object,
            Options.Create(new AuthorityPipelineWorkProcessorOptions { MaxAttemptsBeforeDeadLetter = 1 }),
            TimeProvider.System,
            NullLogger<AuthorityPipelineWorkProcessor>.Instance);

        Func<Task> act = async () => await sut.ProcessPendingBatchAsync(CancellationToken.None);

        await act.Should().NotThrowAsync();
        outbox.Verify(
            r => r.RecordDeadLetterAsync(poisonEntry.OutboxId, It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Once);
        outbox.Verify(r => r.MarkProcessedAsync(invalidEntry.OutboxId, It.IsAny<CancellationToken>()), Times.Once);
    }

    private static AuthorityPipelineWorkOutboxEntry CreateEntryWithValidPayload()
    {
        Guid runId = Guid.NewGuid();

        // Deterministic JSON avoids cross-runtime STJ graph shape drift (Serialize of deep defaults) that can leave
        // evidenceBundleId/contextIngestionRequest missing after Deserialize in the worker gate.
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "default",
                "inlineRequirements": [],
                "documents": [],
                "policyReferences": [],
                "topologyHints": [],
                "securityBaselineHints": [],
                "infrastructureDeclarations": []
              },
              "evidenceBundleId": "bundle-1"
            }
            """;

        AuthorityPipelineWorkPayload? probe = AuthorityPipelineWorkPayloadJson.Deserialize(json);

        if (probe is null ||
            probe.ContextIngestionRequest is null ||
            string.IsNullOrWhiteSpace(probe.EvidenceBundleId))
            throw new InvalidOperationException("CreateEntryWithValidPayload built JSON failing AuthorityPipelineWorkPayloadJson.Deserialize.");

        return new AuthorityPipelineWorkOutboxEntry
        {
            OutboxId = Guid.NewGuid(),
            RunId = runId,
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            AttemptCount = 0,
            PayloadJson = json,
        };
    }

    private static IServiceProvider BuildProvider(
        Mock<IAuthorityPipelineWorkRepository> outbox,
        Mock<IAuthorityRunOrchestrator> orchestrator)
    {
        ServiceCollection services = new();
        services.AddSingleton(outbox.Object);
        services.AddSingleton(orchestrator.Object);
        return services.BuildServiceProvider();
    }

    private static Mock<IServiceScopeFactory> CreateScopeFactory(IServiceProvider provider)
    {
        Mock<IServiceScope> scope = new();
        scope.Setup(s => s.ServiceProvider).Returns(provider);
        Mock<IServiceScopeFactory> scopeFactory = new();
        scopeFactory.Setup(f => f.CreateScope()).Returns(scope.Object);
        return scopeFactory;
    }

    /// <summary>
    ///     For methods returning <c>Task&lt;RunRecord&gt;</c>, configuring Moq with <c>ThrowsAsync</c> can resolve to an
    ///     overload that does not fault the awaited task reliably across versions; use <c>Task.FromException&lt;RunRecord&gt;</c>
    ///     so the worker reliably enters retry / dead-letter handling.
    /// </summary>
    private static void FaultCompleteQueuedOrchestrator(Mock<IAuthorityRunOrchestrator> orchestrator)
    {
        orchestrator
            .Setup(o =>
                o.CompleteQueuedAuthorityPipelineAsync(It.IsAny<ContextIngestionRequest>(), It.IsAny<CancellationToken>()))
            .Returns<ContextIngestionRequest, CancellationToken>((_, _) =>
                Task.FromException<RunRecord>(new InvalidOperationException("orchestrator fault")));
    }
}
