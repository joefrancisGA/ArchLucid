using ArchLucid.Application.SecureNow;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Persistence.ApplicationPorts.Data.Repositories;
using ArchLucid.Core.Persistence.ApplicationPorts.SecureNow;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.SecureNow;

using Microsoft.Extensions.Options;
using Microsoft.Extensions.Time.Testing;

using Moq;

namespace ArchLucid.Application.Tests.SecureNow;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class CollectionRunTriggerServiceTests
{
    [Fact]
    public async Task Durable_duplicate_without_persisted_run_never_replays_external_start()
    {
        ScopeContext scope = NewScope();
        Guid priorRunId = Guid.NewGuid();
        Mock<ICollectionRunRepository> repository = new();
        Mock<ICollectionRunTrigger> trigger = new();
        Mock<ICollectionTriggerClaimRepository> claims = new();
        Mock<IAuditService> audit = new();
        claims.Setup(c => c.TryReserveAsync(
            It.IsAny<ProjectScopeKey>(), "key", It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((false, priorRunId, (byte)0));
        CollectionRunTriggerService service = CreateService(
            repository.Object, trigger.Object, audit.Object, durableClaims: claims.Object);
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.TriggerAsync(scope, "key", ["sub"], CancellationToken.None));
        trigger.Verify(t => t.TriggerAsync(It.IsAny<ScopeContext>(),
            It.IsAny<CollectionRunTriggerRequest>(), It.IsAny<CancellationToken>()), Times.Never);
    }

    [Fact]
    public async Task Durable_winner_uses_reserved_run_and_reconciles_persisted_run()
    {
        ScopeContext scope = NewScope();
        Guid reserved = Guid.NewGuid();
        Mock<ICollectionRunRepository> repository = new();
        Mock<ICollectionRunTrigger> trigger = new();
        Mock<ICollectionTriggerClaimRepository> claims = new();
        Mock<IAuditService> audit = new();
        claims.Setup(c => c.TryReserveAsync(
            It.IsAny<ProjectScopeKey>(), "key", It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((true, reserved, (byte)0));
        claims.Setup(c => c.ReconcilePersistedRunAsync(
            It.IsAny<ProjectScopeKey>(), "key", reserved, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        trigger.Setup(t => t.TriggerAsync(scope,
            It.IsAny<CollectionRunTriggerRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CollectionRunTriggerResult { Schedule = "Daily" });

        CollectionRunTriggerService service = CreateService(
            repository.Object, trigger.Object, audit.Object, durableClaims: claims.Object);
        CollectionRun result = await service.TriggerAsync(scope, "key", ["sub"], CancellationToken.None);
        Assert.Equal(reserved, result.RunId);
        trigger.Verify(t => t.TriggerAsync(scope,
            It.Is<CollectionRunTriggerRequest>(r => r.RunId == reserved),
            It.IsAny<CancellationToken>()), Times.Once);
        repository.Verify(r => r.UpsertAsync(It.Is<CollectionRun>(run => run.RunId == reserved),
            It.IsAny<CancellationToken>()), Times.Once);
        claims.Verify(c => c.ReconcilePersistedRunAsync(
            It.IsAny<ProjectScopeKey>(), "key", reserved, It.IsAny<CancellationToken>()), Times.Once);
    }

    [Fact]
    public async Task TriggerAsync_returns_same_run_for_repeated_idempotency_key()
    {
        ScopeContext scope = NewScope();
        Mock<ICollectionRunRepository> repository = new();
        Mock<ICollectionRunTrigger> trigger = new();
        Mock<IAuditService> audit = new();
        CollectionRun? storedRun = null;

        repository
            .Setup(item => item.GetAsync(scope, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => storedRun);
        repository
            .Setup(item => item.UpsertAsync(It.IsAny<CollectionRun>(), It.IsAny<CancellationToken>()))
            .Callback<CollectionRun, CancellationToken>((run, _) => storedRun = run)
            .Returns(Task.CompletedTask);
        trigger
            .Setup(item => item.TriggerAsync(scope, It.IsAny<CollectionRunTriggerRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CollectionRunTriggerResult { Schedule = "Daily" });

        CollectionRunTriggerService service = CreateService(repository.Object, trigger.Object, audit.Object);

        CollectionRun first = await service.TriggerAsync(scope, "double-click", ["subscription-1"], CancellationToken.None);
        CollectionRun second = await service.TriggerAsync(scope, "double-click", ["subscription-1"], CancellationToken.None);

        Assert.Equal(first.RunId, second.RunId);
        trigger.Verify(
            item => item.TriggerAsync(scope, It.IsAny<CollectionRunTriggerRequest>(), It.IsAny<CancellationToken>()),
            Times.Once);
        audit.Verify(
            item => item.LogAsync(It.Is<AuditEvent>(auditEvent =>
                auditEvent.EventType == AuditEventTypes.SecureNowCollectionRunTriggered
                && auditEvent.RunId == first.RunId), It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task TriggerAsync_throws_when_waiting_admissions_exceed_limit()
    {
        CollectionTriggerAdmissionCounter counter = new();
        counter.Increment();
        Mock<ICollectionRunRepository> repository = new();
        Mock<ICollectionRunTrigger> trigger = new();
        Mock<IAuditService> audit = new();
        CollectionRunTriggerService service = CreateService(
            repository.Object,
            trigger.Object,
            audit.Object,
            admissionCounter: counter,
            capacityOptions: Options.Create(new SecureNowCapacityOptions { MaxWaitingCollectionTriggers = 1 }));

        await Assert.ThrowsAsync<SecureNowCapacityExceededException>(() =>
            service.TriggerAsync(NewScope(), "key", ["sub"], CancellationToken.None));

        trigger.Verify(
            item => item.TriggerAsync(
                It.IsAny<ScopeContext>(),
                It.IsAny<CollectionRunTriggerRequest>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
        Assert.Equal(0, counter.Decrement());
    }

    [Fact]
    public async Task TriggerAsync_releases_waiting_admission_after_start()
    {
        ScopeContext scope = NewScope();
        CollectionTriggerAdmissionCounter counter = new();
        Mock<ICollectionRunRepository> repository = new();
        Mock<ICollectionRunTrigger> trigger = new();
        Mock<IAuditService> audit = new();
        CollectionRun? storedRun = null;
        repository
            .Setup(item => item.GetAsync(scope, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => storedRun);
        repository
            .Setup(item => item.UpsertAsync(It.IsAny<CollectionRun>(), It.IsAny<CancellationToken>()))
            .Callback<CollectionRun, CancellationToken>((run, _) => storedRun = run)
            .Returns(Task.CompletedTask);
        trigger
            .Setup(item => item.TriggerAsync(scope, It.IsAny<CollectionRunTriggerRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CollectionRunTriggerResult { Schedule = "Daily" });

        CollectionRunTriggerService service = CreateService(
            repository.Object, trigger.Object, audit.Object, admissionCounter: counter);
        CollectionRun result = await service.TriggerAsync(scope, "key", ["sub"], CancellationToken.None);

        Assert.NotEqual(Guid.Empty, result.RunId);
        Assert.Equal(1, counter.Increment());
    }

    [Fact]
    public async Task TriggerAsync_records_started_utc_from_injected_time_provider()
    {
        ScopeContext scope = NewScope();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 29, 12, 0, 0, TimeSpan.Zero));
        Mock<ICollectionRunRepository> repository = new();
        Mock<ICollectionRunTrigger> trigger = new();
        Mock<IAuditService> audit = new();
        CollectionRun? storedRun = null;
        repository
            .Setup(item => item.GetAsync(scope, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(() => storedRun);
        repository
            .Setup(item => item.UpsertAsync(It.IsAny<CollectionRun>(), It.IsAny<CancellationToken>()))
            .Callback<CollectionRun, CancellationToken>((run, _) => storedRun = run)
            .Returns(Task.CompletedTask);
        trigger
            .Setup(item => item.TriggerAsync(scope, It.IsAny<CollectionRunTriggerRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CollectionRunTriggerResult { Schedule = "Daily" });

        CollectionRunTriggerService service = CreateService(
            repository.Object, trigger.Object, audit.Object, timeProvider: clock);
        CollectionRun result = await service.TriggerAsync(scope, "key", ["sub"], CancellationToken.None);

        Assert.Equal(clock.GetUtcNow().UtcDateTime, result.StartedUtc);
    }

    [Fact]
    public async Task Durable_winner_records_started_utc_from_injected_time_provider()
    {
        ScopeContext scope = NewScope();
        Guid reserved = Guid.NewGuid();
        FakeTimeProvider clock = new(new DateTimeOffset(2026, 10, 29, 15, 30, 0, TimeSpan.Zero));
        Mock<ICollectionRunRepository> repository = new();
        Mock<ICollectionRunTrigger> trigger = new();
        Mock<ICollectionTriggerClaimRepository> claims = new();
        Mock<IAuditService> audit = new();
        claims.Setup(c => c.TryReserveAsync(
            It.IsAny<ProjectScopeKey>(), "key", It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync((true, reserved, (byte)0));
        claims.Setup(c => c.ReconcilePersistedRunAsync(
            It.IsAny<ProjectScopeKey>(), "key", reserved, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        trigger.Setup(t => t.TriggerAsync(scope,
            It.IsAny<CollectionRunTriggerRequest>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(new CollectionRunTriggerResult { Schedule = "Daily" });

        CollectionRunTriggerService service = CreateService(
            repository.Object,
            trigger.Object,
            audit.Object,
            durableClaims: claims.Object,
            timeProvider: clock);
        CollectionRun result = await service.TriggerAsync(scope, "key", ["sub"], CancellationToken.None);

        Assert.Equal(clock.GetUtcNow().UtcDateTime, result.StartedUtc);
    }

    [Fact]
    public void Constructor_rejects_null_admission_counter()
    {
        Assert.Throws<ArgumentNullException>(() => new CollectionRunTriggerService(
            Mock.Of<ICollectionRunRepository>(),
            Mock.Of<ICollectionRunTrigger>(),
            new InMemoryCollectionRunTriggerIdempotencyStore(),
            Mock.Of<IAuditService>(),
            null!));
    }

    private static ScopeContext NewScope() => new()
    {
        TenantId = Guid.NewGuid(),
        WorkspaceId = Guid.NewGuid(),
        ProjectId = Guid.NewGuid(),
    };

    private static CollectionRunTriggerService CreateService(
        ICollectionRunRepository repository,
        ICollectionRunTrigger trigger,
        IAuditService audit,
        ICollectionTriggerClaimRepository? durableClaims = null,
        CollectionTriggerAdmissionCounter? admissionCounter = null,
        TimeProvider? timeProvider = null,
        IOptions<SecureNowCapacityOptions>? capacityOptions = null)
    {
        return new CollectionRunTriggerService(
            repository,
            trigger,
            new InMemoryCollectionRunTriggerIdempotencyStore(),
            audit,
            admissionCounter ?? new CollectionTriggerAdmissionCounter(),
            timeProvider,
            durableClaims,
            capacityOptions);
    }
}
