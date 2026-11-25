using ArchLucid.Core.Metering;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class UsageEventBlankIdempotencyTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("\t")]
    public void Blank_idempotency_keys_are_normalized_to_absent(string? key)
    {
        UsageEventRepositoryCore.IdempotencyKeyOrNull(key).Should().BeNull();
    }

    [Fact]
    public void Nonblank_idempotency_keys_are_not_modified()
    {
        UsageEventRepositoryCore.IdempotencyKeyOrNull("  key  ").Should().Be("  key  ");
    }

    [Fact]
    public void Batch_selector_keeps_unkeyed_events_and_deduplicates_only_real_keys()
    {
        Guid tenantId = Guid.NewGuid();
        UsageEvent first = Event(tenantId, " ");
        UsageEvent second = Event(tenantId, " ");
        UsageEvent keyed = Event(tenantId, "real-key");
        UsageEvent duplicateKeyed = Event(tenantId, "real-key");

        List<UsageEvent> selected = UsageEventRepositoryCore.SelectDistinctIdempotencyKeysForBatchInsert(
            [first, second, keyed, duplicateKeyed]);

        selected.Select(static usage => usage.Id).Should()
            .Equal(first.Id, second.Id, keyed.Id);
    }

    [Fact]
    public async Task Idempotency_deduplicates_within_tenant_but_not_between_tenants()
    {
        Guid tenantA = Guid.NewGuid();
        Guid tenantB = Guid.NewGuid();
        DateTimeOffset now = new(2026, 11, 23, 0, 0, 0, TimeSpan.Zero);
        UsageEvent first = Event(tenantA, "shared-key", now);
        UsageEvent replay = Event(tenantA, "shared-key", now);
        UsageEvent foreign = Event(tenantB, "shared-key", now);

        UsageEventRepositoryCore.SelectDistinctIdempotencyKeysForBatchInsert(
            [first, replay, foreign]).Select(static row => row.Id)
            .Should().Equal(first.Id, foreign.Id);

        InMemoryUsageEventRepository repository = new();
        await repository.InsertAsync(first, CancellationToken.None);
        await repository.InsertBatchAsync([replay, foreign], CancellationToken.None);

        IReadOnlyList<UsageEvent> firstTenant = await repository.ListAsync(
            tenantA, now.AddMinutes(-1), now.AddMinutes(1), null, 20, CancellationToken.None);
        IReadOnlyList<UsageEvent> secondTenant = await repository.ListAsync(
            tenantB, now.AddMinutes(-1), now.AddMinutes(1), null, 20, CancellationToken.None);

        firstTenant.Select(static row => row.Id).Should().Equal(first.Id);
        secondTenant.Select(static row => row.Id).Should().Equal(foreign.Id);
    }

    [Fact]
    public async Task In_memory_single_and_batch_writes_preserve_distinct_blank_key_usage()
    {
        InMemoryUsageEventRepository repository = new();
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = new(2026, 11, 23, 0, 0, 0, TimeSpan.Zero);
        UsageEvent first = Event(tenantId, " ", now);
        UsageEvent second = Event(tenantId, " ", now);
        UsageEvent third = Event(tenantId, "\t", now);

        await repository.InsertAsync(first, CancellationToken.None);
        await repository.InsertAsync(second, CancellationToken.None);
        await repository.InsertBatchAsync([third], CancellationToken.None);

        IReadOnlyList<UsageEvent> rows = await repository.ListAsync(
            tenantId, now.AddMinutes(-1), now.AddMinutes(1), null, 20, CancellationToken.None);

        rows.Should().HaveCount(3);
        rows.Sum(static row => row.Quantity).Should().Be(3);
    }

    private static UsageEvent Event(Guid tenantId, string? key, DateTimeOffset? recordedUtc = null) =>
        new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            Kind = UsageMeterKind.ApiRequest,
            Quantity = 1,
            RecordedUtc = recordedUtc ?? DateTimeOffset.UtcNow,
            IdempotencyKey = key,
        };
}
