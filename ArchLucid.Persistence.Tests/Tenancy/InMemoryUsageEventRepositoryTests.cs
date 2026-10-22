using ArchLucid.Core.Metering;
using ArchLucid.Persistence.Interfaces;
using ArchLucid.Persistence.Tenancy;

namespace ArchLucid.Persistence.Tests.Tenancy;

[Trait("Category", "Unit")]
public sealed class InMemoryUsageEventRepositoryTests
{
    [Fact]
    public async Task InsertAsync_skips_duplicate_idempotency_key_for_same_tenant()
    {
        InMemoryUsageEventRepository repository = new();
        Guid tenantId = Guid.NewGuid();
        UsageEvent first = NewEvent(tenantId, UsageMeterKind.ApiRequest, quantity: 1, idempotencyKey: "idem-1");
        UsageEvent duplicate = NewEvent(tenantId, UsageMeterKind.ApiRequest, quantity: 9, idempotencyKey: "idem-1");

        await repository.InsertAsync(first, CancellationToken.None);
        await repository.InsertAsync(duplicate, CancellationToken.None);

        IReadOnlyList<UsageEvent> listed = await repository.ListAsync(
            tenantId,
            DateTimeOffset.UtcNow.AddHours(-1),
            DateTimeOffset.UtcNow.AddHours(1),
            kindFilter: null,
            take: 10,
            CancellationToken.None);

        listed.Should().ContainSingle();
        listed[0].Quantity.Should().Be(1);
    }

    [Fact]
    public async Task InsertBatchAsync_skips_only_duplicate_rows()
    {
        InMemoryUsageEventRepository repository = new();
        Guid tenantId = Guid.NewGuid();
        UsageEvent existing = NewEvent(tenantId, UsageMeterKind.ArchitectureRun, quantity: 2, idempotencyKey: "batch-key");
        UsageEvent fresh = NewEvent(tenantId, UsageMeterKind.AgentExecution, quantity: 3, idempotencyKey: "new-key");

        await repository.InsertAsync(existing, CancellationToken.None);
        await repository.InsertBatchAsync(
            [existing, fresh],
            CancellationToken.None);

        IReadOnlyList<UsageEvent> listed = await repository.ListAsync(
            tenantId,
            DateTimeOffset.UtcNow.AddHours(-1),
            DateTimeOffset.UtcNow.AddHours(1),
            kindFilter: null,
            take: 10,
            CancellationToken.None);

        listed.Should().HaveCount(2);
        listed.Should().Contain(e => e.Kind == UsageMeterKind.AgentExecution && e.Quantity == 3);
    }

    [Fact]
    public async Task AggregateByKindAsync_filters_by_tenant_and_period()
    {
        InMemoryUsageEventRepository repository = new();
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset midpoint = DateTimeOffset.UtcNow;
        UsageEvent inside = NewEvent(tenantId, UsageMeterKind.LlmPromptTokens, quantity: 5, recordedUtc: midpoint);
        UsageEvent outside = NewEvent(tenantId, UsageMeterKind.LlmPromptTokens, quantity: 99, recordedUtc: midpoint.AddHours(-2));
        UsageEvent otherTenant = NewEvent(Guid.NewGuid(), UsageMeterKind.LlmPromptTokens, quantity: 7, recordedUtc: midpoint);

        await repository.InsertBatchAsync([inside, outside, otherTenant], CancellationToken.None);

        IReadOnlyList<TenantUsageSummary> summaries = await repository.AggregateByKindAsync(
            tenantId,
            midpoint.AddMinutes(-30),
            midpoint.AddMinutes(30),
            CancellationToken.None);

        summaries.Should().ContainSingle();
        summaries[0].Kind.Should().Be(UsageMeterKind.LlmPromptTokens);
        summaries[0].TotalQuantity.Should().Be(5);
    }

    [Fact]
    public async Task ListAsync_applies_kind_filter_and_minimum_take()
    {
        InMemoryUsageEventRepository repository = new();
        Guid tenantId = Guid.NewGuid();
        DateTimeOffset now = DateTimeOffset.UtcNow;
        UsageEvent api = NewEvent(tenantId, UsageMeterKind.ApiRequest, quantity: 1, recordedUtc: now.AddMinutes(-1));
        UsageEvent agent = NewEvent(tenantId, UsageMeterKind.AgentExecution, quantity: 2, recordedUtc: now);

        await repository.InsertBatchAsync([api, agent], CancellationToken.None);

        IReadOnlyList<UsageEvent> filtered = await repository.ListAsync(
            tenantId,
            now.AddHours(-1),
            now.AddHours(1),
            kindFilter: UsageMeterKind.AgentExecution,
            take: 0,
            CancellationToken.None);

        filtered.Should().ContainSingle();
        filtered[0].Kind.Should().Be(UsageMeterKind.AgentExecution);
    }

    private static UsageEvent NewEvent(
        Guid tenantId,
        UsageMeterKind kind,
        long quantity,
        string? idempotencyKey = null,
        DateTimeOffset? recordedUtc = null)
    {
        return new UsageEvent
        {
            TenantId = tenantId,
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            Kind = kind,
            Quantity = quantity,
            RecordedUtc = recordedUtc ?? DateTimeOffset.UtcNow,
            IdempotencyKey = idempotencyKey,
        };
    }
}
