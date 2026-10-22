using ArchLucid.Contracts.Common;
using ArchLucid.Contracts.Persistence.Agents;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Metering;
using ArchLucid.Persistence.Billing;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Integrations;
using ArchLucid.Persistence.Metering;
using ArchLucid.Persistence.Options;
using ArchLucid.Persistence.Tenancy;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Persistence")]
public sealed class PersistencePackageCoverageBatch9Tests
{
    private static readonly Guid TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111");

    [Fact]
    public async Task InMemoryItsmFindingCorrelationRepository_round_trips_external_key_and_list()
    {
        InMemoryItsmFindingCorrelationRepository sut = new();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid findingRecordId = Guid.NewGuid();

        await sut.RegisterAsync(
            TenantId,
            workspaceId,
            projectId,
            "finding-1",
            "Jira",
            "PROJ-100",
            "sys-100",
            findingRecordId,
            CancellationToken.None);

        ItsmFindingCorrelationRecord? byKey =
            await sut.TryGetByExternalKeyAsync("Jira", "PROJ-100", CancellationToken.None);

        byKey.Should().NotBeNull();
        byKey!.FindingRecordId.Should().Be(findingRecordId);

        IReadOnlyList<ItsmFindingCorrelationRecord> listed =
            await sut.ListByFindingAsync(TenantId, "finding-1", CancellationToken.None);

        listed.Should().ContainSingle();
        listed[0].ExternalKey.Should().Be("PROJ-100");

        bool exists = await sut.FindingRecordExistsAsync(TenantId, "finding-1", findingRecordId, CancellationToken.None);
        exists.Should().BeTrue();
    }

    [Fact]
    public async Task InMemoryItsmFindingCorrelationRepository_updates_finding_record_id_on_existing_row()
    {
        InMemoryItsmFindingCorrelationRepository sut = new();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();
        Guid findingRecordId = Guid.NewGuid();

        await sut.RegisterAsync(
            TenantId,
            workspaceId,
            projectId,
            "finding-2",
            "ServiceNow",
            "INC200",
            null,
            null,
            CancellationToken.None);

        await sut.RegisterAsync(
            TenantId,
            workspaceId,
            projectId,
            "finding-2",
            "ServiceNow",
            "INC200",
            "sys-200",
            findingRecordId,
            CancellationToken.None);

        ItsmFindingCorrelationRecord? loaded =
            await sut.TryGetByFindingAndProviderAsync(TenantId, "finding-2", "ServiceNow", CancellationToken.None);

        loaded.Should().NotBeNull();
        loaded!.FindingRecordId.Should().Be(findingRecordId);
    }

    [Fact]
    public async Task InMemoryItsmFindingCorrelationRepository_update_external_tracking_reports_unchanged()
    {
        InMemoryItsmFindingCorrelationRepository sut = new();
        Guid workspaceId = Guid.NewGuid();
        Guid projectId = Guid.NewGuid();

        await sut.RegisterAsync(
            TenantId,
            workspaceId,
            projectId,
            "finding-3",
            "Jira",
            "PROJ-300",
            "sys-300",
            null,
            CancellationToken.None);

        ItsmFindingCorrelationUpdateResult unchanged = await sut.UpdateExternalTrackingAsync(
            TenantId,
            workspaceId,
            projectId,
            "finding-3",
            "Jira",
            "PROJ-300",
            "sys-300",
            CancellationToken.None);

        unchanged.Status.Should().Be(ItsmFindingCorrelationUpdateStatus.Unchanged);
        unchanged.Prior.Should().BeEquivalentTo(unchanged.Current);
    }

    [Fact]
    public async Task InMemoryBillingLedger_resolves_tenant_by_provider_subscription_id()
    {
        InMemoryBillingLedger ledger = new();
        Guid tenantId = Guid.NewGuid();

        await ledger.ActivateSubscriptionAsync(
            tenantId,
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Stripe",
            "sub_live_123",
            "Team",
            seats: 5,
            workspaces: 1,
            rawWebhookJson: null,
            CancellationToken.None);

        Guid? resolved =
            await ledger.TryResolveTenantIdByProviderSubscriptionIdAsync("sub_live_123", CancellationToken.None);

        resolved.Should().Be(tenantId);
        (await ledger.TryResolveTenantIdByProviderSubscriptionIdAsync(" ", CancellationToken.None)).Should().BeNull();
        (await ledger.TryGetProviderSubscriptionIdAsync(tenantId, CancellationToken.None)).Should().Be("sub_live_123");
    }

    [Fact]
    public async Task InMemoryBillingLedger_records_subscription_state_history()
    {
        InMemoryBillingLedger ledger = new();
        Guid tenantId = Guid.NewGuid();

        await ledger.ActivateSubscriptionAsync(
            tenantId,
            Guid.NewGuid(),
            Guid.NewGuid(),
            "Stripe",
            "sub_hist",
            "Team",
            seats: 2,
            workspaces: 1,
            rawWebhookJson: null,
            CancellationToken.None);
        await ledger.SuspendSubscriptionAsync(tenantId, CancellationToken.None);

        IReadOnlyList<BillingSubscriptionStateHistoryEntry> history =
            await ledger.GetSubscriptionStateHistoryAsync(tenantId, maxRows: 10, CancellationToken.None);

        history.Should().NotBeEmpty();
        history[0].ChangeKind.Should().Be("Suspend");

        Func<Task> invalidMaxRows = async () =>
            await ledger.GetSubscriptionStateHistoryAsync(tenantId, maxRows: 0, CancellationToken.None);

        await invalidMaxRows.Should().ThrowAsync<ArgumentOutOfRangeException>();
    }

    [Fact]
    public async Task UsageMeteringService_skips_when_disabled_or_batch_empty()
    {
        InMemoryUsageEventRepository repository = new();
        FixedOptionsMonitor<MeteringOptions> disabled = new(new MeteringOptions { Enabled = false });
        UsageMeteringService service = new(repository, disabled);
        Guid tenantId = Guid.NewGuid();

        await service.RecordAsync(
            new UsageEvent { TenantId = tenantId, Kind = UsageMeterKind.ApiRequest, Quantity = 1 },
            CancellationToken.None);
        await service.RecordBatchAsync([], CancellationToken.None);

        IReadOnlyList<TenantUsageSummary> summary =
            await service.GetSummaryAsync(
                tenantId,
                DateTimeOffset.UtcNow.AddDays(-1),
                DateTimeOffset.UtcNow,
                CancellationToken.None);

        summary.Should().BeEmpty();
        (await repository.ListAsync(
            tenantId,
            DateTimeOffset.UtcNow.AddDays(-1),
            DateTimeOffset.UtcNow,
            UsageMeterKind.ApiRequest,
            10,
            CancellationToken.None)).Should().BeEmpty();
    }

    [Fact]
    public async Task NoOpAgentOutputEvaluationResultRepository_appends_without_persisting()
    {
        NoOpAgentOutputEvaluationResultRepository sut = new();

        await sut.Invoking(
                r => r.AppendAsync(
                    new AgentOutputEvaluationResultRecord
                    {
                        RunId = Guid.NewGuid().ToString("D"),
                        TraceId = Guid.NewGuid().ToString("D"),
                        CaseId = "case-batch-9",
                        AgentType = AgentType.Topology,
                        OverallScore = 0.75,
                    },
                    CancellationToken.None))
            .Should()
            .NotThrowAsync();

        Func<Task> nullRow = async () => await sut.AppendAsync(null!, CancellationToken.None);
        await nullRow.Should().ThrowAsync<ArgumentNullException>();
    }
}
