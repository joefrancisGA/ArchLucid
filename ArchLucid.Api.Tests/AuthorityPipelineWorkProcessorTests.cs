using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Application.Runs.Orchestration.Pipeline;
using ArchLucid.ContextIngestion.Models;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Common;
using ArchLucid.Core.Runs;
using ArchLucid.Core.Scoping;
using ArchLucid.Host.Core.Configuration;
using ArchLucid.Host.Core.Hosted;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Interfaces;
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
        Mock<IRunRepository> runRepository = new();

        FaultCompleteQueuedOrchestrator(orchestrator);

        AuthorityPipelineWorkOutboxEntry entry = CreateEntryWithValidPayload();

        RunRecord runRow = CreateBoundRun(entry);
        runRow.LegacyRunStatus = nameof(ArchitectureRunStatus.TasksGenerated);

        runRepository
            .Setup(r => r.GetByIdIncludingArchivedAsync(It.IsAny<ScopeContext>(), entry.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(runRow);

        runRepository
            .Setup(r => r.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);

        outbox.Setup(r => r.DequeuePendingAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([entry]);

        IServiceProvider provider = BuildProvider(outbox, orchestrator, runRepository);
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

        runRepository.Verify(
            r => r.UpdateAsync(
                It.Is<RunRecord>(run =>
                    run.RunId == entry.RunId
                    && run.LegacyRunStatus == nameof(ArchitectureRunStatus.Failed)
                    && run.CompletedUtc.HasValue
                    && RunAuthorityPipelineDeadLetterDetection.IsDeadLettered(run)),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ProcessPendingBatchAsync_when_exception_thrown_backs_off_if_retries_remaining()
    {
        Mock<IAuthorityPipelineWorkRepository> outbox = new();
        Mock<IAuthorityRunOrchestrator> orchestrator = new();
        Mock<IRunRepository> runRepository = new();

        FaultCompleteQueuedOrchestrator(orchestrator);

        AuthorityPipelineWorkOutboxEntry entry = CreateEntryWithValidPayload();

        runRepository
            .Setup(r => r.GetByIdIncludingArchivedAsync(It.IsAny<ScopeContext>(), entry.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateBoundRun(entry));

        outbox.Setup(r => r.DequeuePendingAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([entry]);

        IServiceProvider provider = BuildProvider(outbox, orchestrator, runRepository);
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

    [Theory]
    [InlineData("tenant")]
    [InlineData("workspace")]
    [InlineData("project")]
    public async Task ProcessPendingBatchAsync_does_not_consume_or_read_outside_active_drain_scope(string mismatch)
    {
        AuthorityPipelineWorkOutboxEntry entry = CreateEntryWithValidPayload();
        Mock<IAuthorityPipelineWorkRepository> outbox = new(MockBehavior.Strict);
        Mock<IAuthorityRunOrchestrator> orchestrator = new(MockBehavior.Strict);
        Mock<IRunRepository> runs = new(MockBehavior.Strict);
        outbox.Setup(r => r.DequeuePendingAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([entry]);
        using IDisposable drain = AmbientScopeContext.Push(new ScopeContext
        {
            TenantId = mismatch == "tenant" ? Guid.NewGuid() : entry.TenantId,
            WorkspaceId = mismatch == "workspace" ? Guid.NewGuid() : entry.WorkspaceId,
            ProjectId = mismatch == "project" ? Guid.NewGuid() : entry.ProjectId,
        });

        AuthorityPipelineWorkProcessor sut = CreateProcessor(outbox, orchestrator, runs);
        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        outbox.Verify(r => r.DequeuePendingAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()), Times.Once);
        outbox.VerifyNoOtherCalls();
        runs.VerifyNoOtherCalls();
        orchestrator.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("tenant")]
    [InlineData("workspace")]
    [InlineData("project")]
    [InlineData("run")]
    public async Task ProcessPendingBatchAsync_invalid_entry_never_attempts_run_lookup(string missing)
    {
        AuthorityPipelineWorkOutboxEntry entry = CreateEntryWithValidPayload(missing: missing);
        Mock<IAuthorityPipelineWorkRepository> outbox = new();
        Mock<IAuthorityRunOrchestrator> orchestrator = new(MockBehavior.Strict);
        Mock<IRunRepository> runs = new(MockBehavior.Strict);
        outbox.Setup(r => r.DequeuePendingAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([entry]);

        await CreateProcessor(outbox, orchestrator, runs).ProcessPendingBatchAsync(CancellationToken.None);

        outbox.Verify(r => r.MarkProcessedAsync(entry.OutboxId, It.IsAny<CancellationToken>()), Times.Once);
        runs.VerifyNoOtherCalls();
        orchestrator.VerifyNoOtherCalls();
    }

    [Theory]
    [InlineData("tenant")]
    [InlineData("workspace")]
    [InlineData("project")]
    [InlineData("run")]
    [InlineData("archived")]
    public async Task ProcessPendingBatchAsync_rejects_unbound_current_header_without_using_cache(string mismatch)
    {
        AuthorityPipelineWorkOutboxEntry entry = CreateEntryWithValidPayload();
        RunRecord header = CreateBoundRun(entry);

        if (mismatch == "tenant") header.TenantId = Guid.NewGuid();

        if (mismatch == "workspace") header.WorkspaceId = Guid.NewGuid();

        if (mismatch == "project") header.ScopeProjectId = Guid.NewGuid();

        if (mismatch == "run") header.RunId = Guid.NewGuid();

        if (mismatch == "archived") header.ArchivedUtc = DateTime.UtcNow;

        Mock<IAuthorityPipelineWorkRepository> outbox = new();
        Mock<IAuthorityRunOrchestrator> orchestrator = new(MockBehavior.Strict);
        Mock<IRunRepository> runs = new();
        outbox.Setup(r => r.DequeuePendingAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([entry]);
        runs.Setup(r => r.GetByIdAsync(It.IsAny<ScopeContext>(), entry.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateBoundRun(entry));
        runs.Setup(r => r.GetByIdIncludingArchivedAsync(It.Is<ScopeContext>(s =>
                s.TenantId == entry.TenantId && s.WorkspaceId == entry.WorkspaceId && s.ProjectId == entry.ProjectId),
                entry.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);

        await CreateProcessor(outbox, orchestrator, runs).ProcessPendingBatchAsync(CancellationToken.None);

        outbox.Verify(r => r.MarkProcessedAsync(entry.OutboxId, It.IsAny<CancellationToken>()), Times.Once);
        runs.Verify(r => r.GetByIdIncludingArchivedAsync(It.IsAny<ScopeContext>(), entry.RunId, It.IsAny<CancellationToken>()), Times.Once);
        runs.VerifyNoOtherCalls();
        orchestrator.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ProcessPendingBatchAsync_waits_for_a_bound_bundle_before_dispatch_without_loading_its_body()
    {
        AuthorityPipelineWorkOutboxEntry entry = CreateEntryWithValidPayload();
        Mock<IAuthorityPipelineWorkRepository> outbox = new();
        Mock<IAuthorityRunOrchestrator> orchestrator = new();
        Mock<IRunRepository> runs = new();
        Mock<IEvidenceBundleRepository> bundles = new(MockBehavior.Strict);
        outbox.Setup(r => r.DequeuePendingAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([entry]);
        runs.Setup(r => r.GetByIdIncludingArchivedAsync(It.IsAny<ScopeContext>(), entry.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateBoundRun(entry));
        bundles.SetupSequence(r => r.IsBoundToRunAsync(It.Is<ScopeContext>(s =>
                s.TenantId == entry.TenantId && s.WorkspaceId == entry.WorkspaceId && s.ProjectId == entry.ProjectId),
                entry.RunId, "bundle-1", It.IsAny<CancellationToken>()))
            .ReturnsAsync(false).ReturnsAsync(true);
        FaultCompleteQueuedOrchestrator(orchestrator);

        AuthorityPipelineWorkProcessor sut = CreateProcessor(outbox, orchestrator, runs, bundles: bundles);
        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        outbox.Verify(r => r.RecordBackoffAfterProcessingFailureAsync(entry.OutboxId,
            It.IsAny<DateTime>(), It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
        orchestrator.VerifyNoOtherCalls();

        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        orchestrator.Verify(o => o.CompleteQueuedAuthorityPipelineAsync(It.IsAny<ContextIngestionRequest>(),
            It.IsAny<CancellationToken>()), Times.Once);
        bundles.Verify(r => r.IsBoundToRunAsync(It.IsAny<ScopeContext>(), entry.RunId, "bundle-1",
            It.IsAny<CancellationToken>()), Times.Exactly(2));
        bundles.VerifyNoOtherCalls();
    }

    [Fact]
    public async Task ProcessPendingBatchAsync_dead_letter_does_not_update_a_run_that_lost_its_binding()
    {
        AuthorityPipelineWorkOutboxEntry entry = CreateEntryWithValidPayload();
        RunRecord valid = CreateBoundRun(entry);
        RunRecord mismatched = CreateBoundRun(entry);
        mismatched.ScopeProjectId = Guid.NewGuid();
        Mock<IAuthorityPipelineWorkRepository> outbox = new();
        Mock<IAuthorityRunOrchestrator> orchestrator = new();
        Mock<IRunRepository> runs = new();
        outbox.Setup(r => r.DequeuePendingAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([entry]);
        runs.SetupSequence(r => r.GetByIdIncludingArchivedAsync(It.IsAny<ScopeContext>(), entry.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(valid).ReturnsAsync(valid).ReturnsAsync(mismatched);
        FaultCompleteQueuedOrchestrator(orchestrator);

        await CreateProcessor(outbox, orchestrator, runs, maxAttempts: 1).ProcessPendingBatchAsync(CancellationToken.None);

        outbox.Verify(r => r.RecordDeadLetterAsync(entry.OutboxId, It.IsAny<string>(), It.IsAny<CancellationToken>()), Times.Once);
        runs.Verify(r => r.GetByIdIncludingArchivedAsync(It.IsAny<ScopeContext>(), entry.RunId, It.IsAny<CancellationToken>()), Times.Exactly(3));
        runs.VerifyNoOtherCalls();
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
    public async Task ProcessPendingBatchAsync_when_payload_malformed_json_marks_processed_without_dead_letter()
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
            PayloadJson = "{ not-json",
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
        orchestrator.Verify(
            o => o.CompleteQueuedAuthorityPipelineAsync(It.IsAny<ContextIngestionRequest>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ProcessPendingBatchAsync_recovers_blank_payload_project_id_from_persisted_run()
    {
        Mock<IAuthorityPipelineWorkRepository> outbox = new();
        Mock<IAuthorityRunOrchestrator> orchestrator = new();
        Mock<IRunRepository> runRepository = new();

        Guid runId = Guid.NewGuid();
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "   ",
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

        AuthorityPipelineWorkOutboxEntry entry = new()
        {
            OutboxId = Guid.NewGuid(),
            RunId = runId,
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            AttemptCount = 0,
            PayloadJson = json,
        };

        runRepository
            .Setup(r => r.GetByIdIncludingArchivedAsync(It.IsAny<ScopeContext>(), runId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateBoundRun(entry, "authoritative-project"));

        orchestrator
            .Setup(o => o.CompleteQueuedAuthorityPipelineAsync(It.IsAny<ContextIngestionRequest>(), It.IsAny<CancellationToken>()))
            .Callback<ContextIngestionRequest, CancellationToken>((request, _) =>
                request.ProjectId.Should().Be("authoritative-project"))
            .Returns((ContextIngestionRequest _, CancellationToken _) =>
                Task.FromException<RunRecord>(new InvalidOperationException("stop after project id check")));

        outbox.Setup(r => r.DequeuePendingAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([entry]);

        IServiceProvider provider = BuildProvider(outbox, orchestrator, runRepository);
        Mock<IServiceScopeFactory> scopeFactory = CreateScopeFactory(provider);

        AuthorityPipelineWorkProcessor sut = new(
            scopeFactory.Object,
            Options.Create(new AuthorityPipelineWorkProcessorOptions { MaxAttemptsBeforeDeadLetter = 3 }),
            TimeProvider.System,
            NullLogger<AuthorityPipelineWorkProcessor>.Instance);

        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        orchestrator.Verify(
            o => o.CompleteQueuedAuthorityPipelineAsync(
                It.Is<ContextIngestionRequest>(r => r.ProjectId == "authoritative-project"),
                It.IsAny<CancellationToken>()),
            Times.Once);
        outbox.Verify(r => r.MarkProcessedAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task ProcessPendingBatchAsync_overwrites_stale_payload_project_id_from_persisted_run()
    {
        Mock<IAuthorityPipelineWorkRepository> outbox = new();
        Mock<IAuthorityRunOrchestrator> orchestrator = new();
        Mock<IRunRepository> runRepository = new();

        AuthorityPipelineWorkOutboxEntry entry = CreateEntryWithValidPayload(staleProjectId: "stale-project");

        runRepository
            .Setup(r => r.GetByIdIncludingArchivedAsync(It.IsAny<ScopeContext>(), entry.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateBoundRun(entry, "authoritative-project"));

        orchestrator
            .Setup(o => o.CompleteQueuedAuthorityPipelineAsync(It.IsAny<ContextIngestionRequest>(), It.IsAny<CancellationToken>()))
            .Callback<ContextIngestionRequest, CancellationToken>((request, _) =>
                request.ProjectId.Should().Be("authoritative-project"))
            .Returns((ContextIngestionRequest _, CancellationToken _) =>
                Task.FromException<RunRecord>(new InvalidOperationException("stop after project id check")));

        outbox.Setup(r => r.DequeuePendingAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([entry]);

        IServiceProvider provider = BuildProvider(outbox, orchestrator, runRepository);
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

        orchestrator.Verify(
            o => o.CompleteQueuedAuthorityPipelineAsync(
                It.Is<ContextIngestionRequest>(r => r.ProjectId == "authoritative-project"),
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task ProcessPendingBatchAsync_processes_batch_without_throwing_when_one_entry_fails()
    {
        Mock<IAuthorityPipelineWorkRepository> outbox = new();
        Mock<IAuthorityRunOrchestrator> orchestrator = new();
        Mock<IRunRepository> runRepository = new();

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

        runRepository
            .Setup(r => r.GetByIdIncludingArchivedAsync(It.IsAny<ScopeContext>(), poisonEntry.RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(CreateBoundRun(poisonEntry));

        outbox.Setup(r => r.DequeuePendingAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync([poisonEntry, invalidEntry]);

        IServiceProvider provider = BuildProvider(outbox, orchestrator, runRepository);
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

    [Fact]
    public async Task ProcessPendingBatchAsync_creates_isolated_scope_per_dequeued_entry()
    {
        Mock<IAuthorityPipelineWorkRepository> outbox = new();
        Mock<IAuthorityRunOrchestrator> orchestrator = new();

        List<AuthorityPipelineWorkOutboxEntry> entries =
        [
            CreateInvalidPayloadEntry(),
            CreateInvalidPayloadEntry(),
            CreateInvalidPayloadEntry(),
        ];

        outbox.Setup(r => r.DequeuePendingAsync(It.IsAny<int>(), It.IsAny<int>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(entries);

        int scopeCreates = 0;
        IServiceProvider provider = BuildProvider(outbox, orchestrator);
        Mock<IServiceScopeFactory> scopeFactory = new();
        scopeFactory.Setup(f => f.CreateScope()).Returns(() =>
        {
            Interlocked.Increment(ref scopeCreates);
            Mock<IServiceScope> scope = new();
            scope.Setup(s => s.ServiceProvider).Returns(provider);
            scope.Setup(s => s.Dispose());
            return scope.Object;
        });

        AuthorityPipelineWorkProcessorOptions options = new()
        {
            MaxConcurrentBatchEntries = 3,
        };

        AuthorityPipelineWorkProcessor sut = new(
            scopeFactory.Object,
            Options.Create(options),
            TimeProvider.System,
            NullLogger<AuthorityPipelineWorkProcessor>.Instance);

        await sut.ProcessPendingBatchAsync(CancellationToken.None);

        scopeCreates.Should().BeGreaterThanOrEqualTo(entries.Count + 1);
        outbox.Verify(r => r.MarkProcessedAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()), Times.Exactly(entries.Count));
    }

    private static AuthorityPipelineWorkOutboxEntry CreateInvalidPayloadEntry()
    {
        return new AuthorityPipelineWorkOutboxEntry
        {
            OutboxId = Guid.NewGuid(),
            RunId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            AttemptCount = 0,
            PayloadJson = "{}",
        };
    }

    private static AuthorityPipelineWorkOutboxEntry CreateEntryWithValidPayload(
        string staleProjectId = "default", string? missing = null)
    {
        Guid runId = Guid.NewGuid();

        // Deterministic JSON avoids cross-runtime STJ graph shape drift (Serialize of deep defaults) that can leave
        // evidenceBundleId/contextIngestionRequest missing after Deserialize in the worker gate.
        string json =
            $$"""
            {
              "contextIngestionRequest": {
                "runId": "{{runId}}",
                "projectId": "{{staleProjectId}}",
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
            RunId = missing == "run" ? Guid.Empty : runId,
            TenantId = missing == "tenant" ? Guid.Empty : Guid.NewGuid(),
            WorkspaceId = missing == "workspace" ? Guid.Empty : Guid.NewGuid(),
            ProjectId = missing == "project" ? Guid.Empty : Guid.NewGuid(),
            AttemptCount = 0,
            PayloadJson = json,
        };
    }

    private static RunRecord CreateBoundRun(AuthorityPipelineWorkOutboxEntry entry, string projectId = "default") =>
        new()
        {
            RunId = entry.RunId,
            TenantId = entry.TenantId,
            WorkspaceId = entry.WorkspaceId,
            ScopeProjectId = entry.ProjectId,
            ProjectId = projectId,
        };

    private static AuthorityPipelineWorkProcessor CreateProcessor(
        Mock<IAuthorityPipelineWorkRepository> outbox, Mock<IAuthorityRunOrchestrator> orchestrator,
        Mock<IRunRepository> runs, int maxAttempts = 3, Mock<IEvidenceBundleRepository>? bundles = null) =>
        new(CreateScopeFactory(BuildProvider(outbox, orchestrator, runs, bundles)).Object,
            Options.Create(new AuthorityPipelineWorkProcessorOptions { MaxAttemptsBeforeDeadLetter = maxAttempts }),
            TimeProvider.System, NullLogger<AuthorityPipelineWorkProcessor>.Instance);

    private static IServiceProvider BuildProvider(
        Mock<IAuthorityPipelineWorkRepository> outbox,
        Mock<IAuthorityRunOrchestrator> orchestrator,
        Mock<IRunRepository>? runRepository = null,
        Mock<IEvidenceBundleRepository>? bundles = null)
    {
        ServiceCollection services = new();
        services.AddSingleton(outbox.Object);
        services.AddSingleton(orchestrator.Object);
        services.AddSingleton(runRepository?.Object ?? new Mock<IRunRepository>().Object);

        if (bundles is null)
        {
            bundles = new Mock<IEvidenceBundleRepository>();
            bundles.Setup(r => r.IsBoundToRunAsync(It.IsAny<ScopeContext>(), It.IsAny<Guid>(),
                It.IsAny<string>(), It.IsAny<CancellationToken>())).ReturnsAsync(true);
        }
        services.AddSingleton(bundles.Object);
        services.AddSingleton<IRunStateTransitionService, RunStateTransitionService>();
        services.AddLogging();
        services.AddSingleton<AuthorityPipelineExecuteWorkHandler>();
        services.AddSingleton<IAuthorityPipelineWorkHandler>(sp => sp.GetRequiredService<AuthorityPipelineExecuteWorkHandler>());
        services.AddSingleton<IAuthorityPipelineWorkHandler, AuthorityPipelineCommitWorkHandler>();
        services.AddSingleton<IAuthorityPipelineWorkHandler, AuthorityPipelineExtractorWorkHandler>();
        return services.BuildServiceProvider();
    }

    private static Mock<IServiceScopeFactory> CreateScopeFactory(IServiceProvider provider)
    {
        Mock<IServiceScopeFactory> scopeFactory = new();
        scopeFactory.Setup(f => f.CreateScope()).Returns(() =>
        {
            Mock<IServiceScope> scope = new();
            scope.Setup(s => s.ServiceProvider).Returns(provider);
            scope.Setup(s => s.Dispose());
            return scope.Object;
        });

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
