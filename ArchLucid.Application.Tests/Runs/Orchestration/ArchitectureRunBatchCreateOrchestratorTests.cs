using ArchLucid.Application.Common;
using ArchLucid.Application.Runs;
using ArchLucid.Application.Runs.Orchestration;
using ArchLucid.Contracts.Metadata;
using ArchLucid.Contracts.Requests;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Data.Repositories;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Orchestration;

/// <summary>
///     Batch create semantics for <see cref="ArchitectureRunBatchCreateOrchestrator" />: per-item failure isolation,
///     batch-level idempotency replay, and the single acceptance audit event.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ArchitectureRunBatchCreateOrchestratorTests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    private static readonly Guid WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222");

    private static readonly Guid ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333");

    [Fact]
    public async Task CreateBatchAsync_null_requests_throws_ArgumentNullException()
    {
        ArchitectureRunBatchCreateOrchestrator sut = CreateSut(out _, out _, out _);

        Func<Task> act = async () => await sut.CreateBatchAsync(null!, null, "corr-1", CancellationToken.None);

        await act.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public async Task CreateBatchAsync_creates_one_run_per_item()
    {
        ArchitectureRunBatchCreateOrchestrator sut = CreateSut(out Mock<IArchitectureRunCreateOrchestrator> createOrchestrator, out _, out _);

        SetupCreateRun(createOrchestrator, "run-a");

        BatchCreateRunOrchestrationResult result = await sut.CreateBatchAsync(
            [Request("req-a"), Request("req-b")],
            null,
            "corr-1",
            CancellationToken.None);

        result.Outcome.Should().Be(BatchCreateRunOutcome.Accepted);
        result.Items.Should().HaveCount(2);
        result.Items.Should().OnlyContain(item => item.Succeeded && item.RunId == "run-a");
        createOrchestrator.Verify(
            o => o.CreateRunAsync(It.IsAny<ArchitectureRequest>(), null, It.IsAny<CancellationToken>()),
            Times.Exactly(2));
    }

    [Fact]
    public async Task CreateBatchAsync_reports_null_item_without_calling_create()
    {
        ArchitectureRunBatchCreateOrchestrator sut = CreateSut(out Mock<IArchitectureRunCreateOrchestrator> createOrchestrator, out _, out _);

        BatchCreateRunOrchestrationResult result = await sut.CreateBatchAsync(
            [null],
            null,
            "corr-1",
            CancellationToken.None);

        result.Items.Should().HaveCount(1);
        result.Items[0].Succeeded.Should().BeFalse();
        result.Items[0].FailureKind.Should().Be(BatchCreateRunItemFailureKind.NullItem);
        result.Items[0].ErrorMessage.Should().Be("Null item in batch.");
        createOrchestrator.Verify(
            o => o.CreateRunAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CreateRunIdempotencyState?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task CreateBatchAsync_maps_conflict_to_conflict_failure_and_continues()
    {
        ArchitectureRunBatchCreateOrchestrator sut = CreateSut(out Mock<IArchitectureRunCreateOrchestrator> createOrchestrator, out _, out _);

        createOrchestrator
            .SetupSequence(o => o.CreateRunAsync(It.IsAny<ArchitectureRequest>(), null, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new ConflictException("duplicate request"))
            .ReturnsAsync(new CreateRunResult { Run = new ArchitectureRun { RunId = "run-b" } });

        BatchCreateRunOrchestrationResult result = await sut.CreateBatchAsync(
            [Request("req-a"), Request("req-b")],
            null,
            "corr-1",
            CancellationToken.None);

        result.Items[0].FailureKind.Should().Be(BatchCreateRunItemFailureKind.Conflict);
        result.Items[0].ErrorMessage.Should().Be("duplicate request");
        result.Items[0].RequestId.Should().Be("req-a");
        result.Items[1].Succeeded.Should().BeTrue();
    }

    [Fact]
    public async Task CreateBatchAsync_maps_invalid_operation_to_invalid_request_failure()
    {
        ArchitectureRunBatchCreateOrchestrator sut = CreateSut(out Mock<IArchitectureRunCreateOrchestrator> createOrchestrator, out _, out _);

        createOrchestrator
            .Setup(o => o.CreateRunAsync(It.IsAny<ArchitectureRequest>(), null, It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("unsupported preset"));

        BatchCreateRunOrchestrationResult result = await sut.CreateBatchAsync(
            [Request("req-a")],
            null,
            "corr-1",
            CancellationToken.None);

        result.Items[0].FailureKind.Should().Be(BatchCreateRunItemFailureKind.InvalidRequest);
        result.Items[0].ErrorMessage.Should().Be("unsupported preset");
    }

    [Fact]
    public async Task CreateBatchAsync_logs_one_acceptance_audit_event_with_counts()
    {
        ArchitectureRunBatchCreateOrchestrator sut = CreateSut(
            out Mock<IArchitectureRunCreateOrchestrator> createOrchestrator,
            out _,
            out Mock<IAuditService> auditService);

        createOrchestrator
            .SetupSequence(o => o.CreateRunAsync(It.IsAny<ArchitectureRequest>(), null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CreateRunResult { Run = new ArchitectureRun { RunId = "run-a" } })
            .ThrowsAsync(new ConflictException("duplicate request"));

        AuditEvent? logged = null;
        auditService
            .Setup(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((e, _) => logged = e)
            .Returns(Task.CompletedTask);

        await sut.CreateBatchAsync([Request("req-a"), Request("req-b")], null, "corr-9", CancellationToken.None);

        logged.Should().NotBeNull();
        logged!.EventType.Should().Be(AuditEventTypes.ArchitectureRunBatchAccepted);
        logged.CorrelationId.Should().Be("corr-9");
        logged.TenantId.Should().Be(TenantId);
        logged.WorkspaceId.Should().Be(WorkspaceId);
        logged.ProjectId.Should().Be(ProjectId);
        logged.DataJson.Should().Contain("\"itemCount\":2").And.Contain("\"succeeded\":1").And.Contain("\"failed\":1");
        auditService.Verify(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task CreateBatchAsync_records_batch_idempotency_reservation_when_key_supplied()
    {
        ArchitectureRunBatchCreateOrchestrator sut = CreateSut(
            out Mock<IArchitectureRunCreateOrchestrator> createOrchestrator,
            out Mock<ICommitRunIdempotencyRepository> idempotencyRepository,
            out _);

        SetupCreateRun(createOrchestrator, "run-a");

        CreateRunIdempotencyState idempotency = Idempotency([1, 2, 3], [9, 9]);

        await sut.CreateBatchAsync([Request("req-a")], idempotency, "corr-1", CancellationToken.None);

        idempotencyRepository.Verify(
            r => r.TryInsertAsync(
                TenantId,
                WorkspaceId,
                ProjectId,
                It.Is<string>(static key => key.StartsWith("batch_", StringComparison.Ordinal)),
                idempotency.IdempotencyKeyHash,
                idempotency.RequestFingerprint,
                It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task CreateBatchAsync_returns_replay_without_creating_runs_when_key_already_recorded()
    {
        ArchitectureRunBatchCreateOrchestrator sut = CreateSut(
            out Mock<IArchitectureRunCreateOrchestrator> createOrchestrator,
            out Mock<ICommitRunIdempotencyRepository> idempotencyRepository,
            out Mock<IAuditService> auditService);

        byte[] fingerprint = [7, 7, 7];

        idempotencyRepository
            .Setup(r => r.TryGetAsync(
                TenantId,
                WorkspaceId,
                ProjectId,
                It.IsAny<string>(),
                It.IsAny<byte[]>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CommitRunIdempotencyLookup { RequestFingerprint = fingerprint });

        BatchCreateRunOrchestrationResult result = await sut.CreateBatchAsync(
            [Request("req-a")],
            Idempotency([1, 2, 3], fingerprint),
            "corr-1",
            CancellationToken.None);

        result.Outcome.Should().Be(BatchCreateRunOutcome.IdempotentReplay);
        result.Items.Should().BeEmpty();
        createOrchestrator.Verify(
            o => o.CreateRunAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CreateRunIdempotencyState?>(), It.IsAny<CancellationToken>()),
            Times.Never);
        auditService.Verify(a => a.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task CreateBatchAsync_returns_payload_mismatch_when_key_reused_with_different_payload()
    {
        ArchitectureRunBatchCreateOrchestrator sut = CreateSut(
            out Mock<IArchitectureRunCreateOrchestrator> createOrchestrator,
            out Mock<ICommitRunIdempotencyRepository> idempotencyRepository,
            out _);

        idempotencyRepository
            .Setup(r => r.TryGetAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<string>(),
                It.IsAny<byte[]>(),
                It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CommitRunIdempotencyLookup { RequestFingerprint = [7, 7, 7] });

        BatchCreateRunOrchestrationResult result = await sut.CreateBatchAsync(
            [Request("req-a")],
            Idempotency([1, 2, 3], [8, 8, 8]),
            "corr-1",
            CancellationToken.None);

        result.Outcome.Should().Be(BatchCreateRunOutcome.IdempotencyKeyPayloadMismatch);
        result.Items.Should().BeEmpty();
        createOrchestrator.Verify(
            o => o.CreateRunAsync(It.IsAny<ArchitectureRequest>(), It.IsAny<CreateRunIdempotencyState?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    private static ArchitectureRequest Request(string requestId)
    {
        return new ArchitectureRequest { RequestId = requestId };
    }

    private static CreateRunIdempotencyState Idempotency(byte[] keyHash, byte[] fingerprint)
    {
        return new CreateRunIdempotencyState(TenantId, WorkspaceId, ProjectId, keyHash, fingerprint);
    }

    private static void SetupCreateRun(Mock<IArchitectureRunCreateOrchestrator> createOrchestrator, string runId)
    {
        createOrchestrator
            .Setup(o => o.CreateRunAsync(It.IsAny<ArchitectureRequest>(), null, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CreateRunResult { Run = new ArchitectureRun { RunId = runId } });
    }

    private static ArchitectureRunBatchCreateOrchestrator CreateSut(
        out Mock<IArchitectureRunCreateOrchestrator> createOrchestrator,
        out Mock<ICommitRunIdempotencyRepository> idempotencyRepository,
        out Mock<IAuditService> auditService)
    {
        createOrchestrator = new Mock<IArchitectureRunCreateOrchestrator>(MockBehavior.Loose);
        idempotencyRepository = new Mock<ICommitRunIdempotencyRepository>(MockBehavior.Loose);
        auditService = new Mock<IAuditService>(MockBehavior.Loose);

        Mock<IScopeContextProvider> scopeContextProvider = new(MockBehavior.Loose);
        scopeContextProvider
            .Setup(p => p.GetCurrentScope())
            .Returns(new ScopeContext { TenantId = TenantId, WorkspaceId = WorkspaceId, ProjectId = ProjectId });

        Mock<IActorContext> actorContext = new(MockBehavior.Loose);
        actorContext.Setup(a => a.GetActor()).Returns("tester@example.com");

        return new ArchitectureRunBatchCreateOrchestrator(
            createOrchestrator.Object,
            idempotencyRepository.Object,
            scopeContextProvider.Object,
            actorContext.Object,
            auditService.Object);
    }
}
