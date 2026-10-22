using ArchLucid.Host.Core.Hosted;
using ArchLucid.Persistence.IntegrationOutbox;

using FluentAssertions;

using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;

namespace ArchLucid.Host.Core.Tests.Hosted;

[Trait("Category", "Unit")]
public sealed class IntegrationEventDlqRetryBackgroundWorkTests
{
    [Fact]
    public async Task RunSinglePassAsync_requeues_eligible_dead_letter_behind_permanently_failed_cap()
    {
        DateTime utcNow = new(2026, 8, 23, 12, 0, 0, DateTimeKind.Utc);
        InMemoryIntegrationEventOutboxRepository repository = new();
        Guid eligibleId = await DeadLetterAsync(
            repository,
            retryCount: 0,
            deadLetteredUtc: utcNow.AddHours(-2));

        for (int i = 0; i < 100; i++)
        {
            await DeadLetterAsync(
                repository,
                retryCount: IntegrationEventDlqRetryPolicy.MaxAutoRetryCount,
                deadLetteredUtc: utcNow.AddMinutes(-i));
        }

        ServiceProvider provider = BuildProvider(repository, new FakeTimeProvider(utcNow));

        await IntegrationEventDlqRetryBackgroundWork.RunSinglePassAsync(
            provider.GetRequiredService<IServiceScopeFactory>(),
            NullLogger.Instance,
            CancellationToken.None);

        (await repository.CountIntegrationOutboxDeadLetterAsync(CancellationToken.None)).Should().Be(100);
        (await repository.DequeuePendingAsync(10, CancellationToken.None))
            .Should()
            .ContainSingle(x => x.OutboxId == eligibleId);
    }

    [Fact]
    public async Task RunSinglePassAsync_does_not_requeue_before_backoff_when_clock_is_injected()
    {
        DateTime deadLetteredUtc = new(2026, 8, 26, 5, 0, 0, DateTimeKind.Utc);
        DateTime passUtc = deadLetteredUtc.AddSeconds(30);
        InMemoryIntegrationEventOutboxRepository repository = new();

        await DeadLetterAsync(repository, retryCount: 1, deadLetteredUtc: deadLetteredUtc);

        ServiceProvider provider = BuildProvider(repository, new FakeTimeProvider(passUtc));

        await IntegrationEventDlqRetryBackgroundWork.RunSinglePassAsync(
            provider.GetRequiredService<IServiceScopeFactory>(),
            NullLogger.Instance,
            CancellationToken.None);

        (await repository.CountIntegrationOutboxDeadLetterAsync(CancellationToken.None)).Should().Be(1);
        (await repository.DequeuePendingAsync(10, CancellationToken.None)).Should().BeEmpty();
    }

    [Fact]
    public async Task RunSinglePassAsync_requeues_after_backoff_when_clock_is_injected()
    {
        DateTime deadLetteredUtc = new(2026, 8, 26, 5, 0, 0, DateTimeKind.Utc);
        DateTime passUtc = deadLetteredUtc.AddMinutes(3);
        InMemoryIntegrationEventOutboxRepository repository = new();
        Guid outboxId = await DeadLetterAsync(repository, retryCount: 1, deadLetteredUtc: deadLetteredUtc);

        ServiceProvider provider = BuildProvider(repository, new FakeTimeProvider(passUtc));

        await IntegrationEventDlqRetryBackgroundWork.RunSinglePassAsync(
            provider.GetRequiredService<IServiceScopeFactory>(),
            NullLogger.Instance,
            CancellationToken.None);

        (await repository.CountIntegrationOutboxDeadLetterAsync(CancellationToken.None)).Should().Be(0);
        (await repository.DequeuePendingAsync(10, CancellationToken.None))
            .Should()
            .ContainSingle(x => x.OutboxId == outboxId);
    }

    private static ServiceProvider BuildProvider(
        IIntegrationEventOutboxRepository repository,
        TimeProvider? clock = null)
    {
        ServiceCollection services = new();
        services.AddSingleton(repository);
        services.AddSingleton(clock ?? TimeProvider.System);

        return services.BuildServiceProvider();
    }

    private sealed class FakeTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }

    private static async Task<Guid> DeadLetterAsync(
        InMemoryIntegrationEventOutboxRepository repository,
        int retryCount,
        DateTime deadLetteredUtc)
    {
        Guid tenantId = Guid.NewGuid();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        await repository.EnqueueAsync(
            null,
            "evt",
            null,
            new byte[] { 1 },
            tenantId,
            workspaceId,
            projectId,
            CancellationToken.None);

        IReadOnlyList<IntegrationEventOutboxEntry> batch =
            await repository.DequeuePendingAsync(1, CancellationToken.None);

        Guid outboxId = batch[0].OutboxId;

        await repository.RecordPublishFailureAsync(
            outboxId,
            retryCount,
            null,
            deadLetteredUtc,
            "boom",
            CancellationToken.None);

        return outboxId;
    }
}
