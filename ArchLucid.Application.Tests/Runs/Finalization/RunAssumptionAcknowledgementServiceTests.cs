using ArchLucid.Application;
using ArchLucid.Application.Common;
using ArchLucid.Application.Runs.Finalization;
using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Runs;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Models;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Runs.Finalization;

/// <summary>TB-2345 item 49: acknowledgements live on the run header, not in the browser.</summary>
[Trait("Suite", "Core")]
[Trait("Category", "Unit")]
public sealed class RunAssumptionAcknowledgementServiceTests
{
    private static readonly ScopeContext Scope = new()
    {
        TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
        WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
        ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
    };

    private static readonly Guid RunId = Guid.Parse("44444444-4444-4444-4444-444444444444");

    private readonly Mock<IRunRepository> _runRepository = new(MockBehavior.Strict);
    private readonly Mock<IActorContext> _actorContext = new(MockBehavior.Strict);
    private readonly Mock<IAuditService> _auditService = new(MockBehavior.Strict);

    [Fact]
    public async Task GetAsync_returns_empty_document_when_nothing_acknowledged()
    {
        SetupHeader(new RunRecord { RunId = RunId });
        RunAssumptionAcknowledgementService service = CreateService();

        RunAssumptionAcknowledgementDocument document = await service.GetAsync(Scope, RunId, CancellationToken.None);

        document.AcknowledgedAssumptionIds.Should().BeEmpty();
        document.ActorUserId.Should().BeEmpty();
    }

    [Fact]
    public async Task GetAsync_returns_persisted_document()
    {
        RunAssumptionAcknowledgementDocument stored = new()
        {
            ActorUserId = "operator",
            AcknowledgedAssumptionIds = ["assumption-a"],
        };
        SetupHeader(new RunRecord
        {
            RunId = RunId,
            AcknowledgedAssumptionsJson = RunAssumptionAcknowledgementJson.Serialize(stored),
        });
        RunAssumptionAcknowledgementService service = CreateService();

        RunAssumptionAcknowledgementDocument document = await service.GetAsync(Scope, RunId, CancellationToken.None);

        document.AcknowledgedAssumptionIds.Should().Equal("assumption-a");
        document.ActorUserId.Should().Be("operator");
    }

    [Fact]
    public async Task GetAsync_throws_when_run_is_outside_scope()
    {
        SetupHeader(null);
        RunAssumptionAcknowledgementService service = CreateService();

        Func<Task> act = () => service.GetAsync(Scope, RunId, CancellationToken.None);

        await act.Should().ThrowAsync<RunNotFoundException>();
    }

    [Fact]
    public async Task GetAcknowledgedIdsAsync_returns_empty_when_run_missing_or_column_null()
    {
        SetupHeader(null);
        RunAssumptionAcknowledgementService service = CreateService();

        IReadOnlySet<string> ids = await service.GetAcknowledgedIdsAsync(Scope, RunId, CancellationToken.None);

        ids.Should().BeEmpty();
    }

    [Fact]
    public async Task PutAsync_normalizes_sorts_persists_and_audits()
    {
        RunRecord header = new() { RunId = RunId };
        SetupHeader(header);
        _actorContext.Setup(context => context.GetActor()).Returns("operator@example.test");
        _runRepository
            .Setup(repository => repository.UpdateAsync(header, It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);
        AuditEvent? logged = null;
        _auditService
            .Setup(audit => audit.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .Callback<AuditEvent, CancellationToken>((auditEvent, _) => logged = auditEvent)
            .Returns(Task.CompletedTask);
        RunAssumptionAcknowledgementService service = CreateService();

        RunAssumptionAcknowledgementDocument saved = await service.PutAsync(
            Scope,
            RunId,
            [" assumption-b", "assumption-a", "assumption-a", ""],
            CancellationToken.None);

        saved.AcknowledgedAssumptionIds.Should().Equal("assumption-a", "assumption-b");
        saved.ActorUserId.Should().Be("operator@example.test");
        header.AcknowledgedAssumptionsJson.Should().NotBeNullOrWhiteSpace();
        RunAssumptionAcknowledgementJson.ReadAcknowledgedIds(header.AcknowledgedAssumptionsJson)
            .Should().BeEquivalentTo(["assumption-a", "assumption-b"]);
        logged.Should().NotBeNull();
        logged!.EventType.Should().Be(AuditEventTypes.RunAssumptionsAcknowledged);
        logged.RunId.Should().Be(RunId);
        logged.TenantId.Should().Be(Scope.TenantId);
        _runRepository.Verify(
            repository => repository.UpdateAsync(header, It.IsAny<CancellationToken>(), null, null),
            Times.Once);
    }

    [Fact]
    public async Task PutAsync_survives_audit_failure()
    {
        RunRecord header = new() { RunId = RunId };
        SetupHeader(header);
        _actorContext.Setup(context => context.GetActor()).Returns("operator");
        _runRepository
            .Setup(repository => repository.UpdateAsync(header, It.IsAny<CancellationToken>(), null, null))
            .Returns(Task.CompletedTask);
        _auditService
            .Setup(audit => audit.LogAsync(It.IsAny<AuditEvent>(), It.IsAny<CancellationToken>()))
            .ThrowsAsync(new InvalidOperationException("audit sink down"));
        RunAssumptionAcknowledgementService service = CreateService();

        Func<Task> act = () => service.PutAsync(Scope, RunId, ["assumption-a"], CancellationToken.None);

        await act.Should().NotThrowAsync();
    }

    [Fact]
    public async Task PutAsync_rejects_sealed_run_with_conflict()
    {
        SetupHeader(new RunRecord { RunId = RunId, GoldenManifestId = Guid.NewGuid() });
        RunAssumptionAcknowledgementService service = CreateService();

        Func<Task> act = () => service.PutAsync(Scope, RunId, ["assumption-a"], CancellationToken.None);

        await act.Should().ThrowAsync<ConflictException>()
            .WithMessage("*cannot change after the review is finalized*");
        _runRepository.Verify(
            repository => repository.UpdateAsync(It.IsAny<RunRecord>(), It.IsAny<CancellationToken>(), null, null),
            Times.Never);
    }

    [Fact]
    public async Task PutAsync_throws_when_run_missing()
    {
        SetupHeader(null);
        RunAssumptionAcknowledgementService service = CreateService();

        Func<Task> act = () => service.PutAsync(Scope, RunId, ["assumption-a"], CancellationToken.None);

        await act.Should().ThrowAsync<RunNotFoundException>();
    }

    [Fact]
    public async Task PutAsync_rejects_null_ids_and_scope()
    {
        RunAssumptionAcknowledgementService service = CreateService();

        Func<Task> nullIds = () => service.PutAsync(Scope, RunId, null!, CancellationToken.None);
        Func<Task> nullScope = () => service.GetAsync(null!, RunId, CancellationToken.None);

        await nullIds.Should().ThrowAsync<ArgumentNullException>();
        await nullScope.Should().ThrowAsync<ArgumentNullException>();
    }

    [Fact]
    public void Constructor_rejects_null_dependencies()
    {
        Action nullRepository = () => _ = new RunAssumptionAcknowledgementService(null!, _actorContext.Object, _auditService.Object);
        Action nullActor = () => _ = new RunAssumptionAcknowledgementService(_runRepository.Object, null!, _auditService.Object);
        Action nullAudit = () => _ = new RunAssumptionAcknowledgementService(_runRepository.Object, _actorContext.Object, null!);

        nullRepository.Should().Throw<ArgumentNullException>();
        nullActor.Should().Throw<ArgumentNullException>();
        nullAudit.Should().Throw<ArgumentNullException>();
    }

    private void SetupHeader(RunRecord? header)
    {
        _runRepository
            .Setup(repository => repository.GetByIdAsync(Scope, RunId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(header);
    }

    private RunAssumptionAcknowledgementService CreateService()
    {
        return new RunAssumptionAcknowledgementService(_runRepository.Object, _actorContext.Object, _auditService.Object);
    }
}
