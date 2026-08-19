using ArchLucid.Contracts.Governance.PolicyPacks;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Scoping;
using ArchLucid.Persistence.Audit;
using ArchLucid.Persistence.Billing;
using ArchLucid.Persistence.Cosmos;
using ArchLucid.Persistence.Data.Repositories;
using ArchLucid.Persistence.Governance;
using ArchLucid.Persistence.Repositories;
using ArchLucid.Persistence.Scoping;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Persistence.Tests;

[Trait("Category", "Unit")]
public sealed class PersistencePackageCoverageBatchTests
{
    [Fact]
    public async Task NoOpAuditEventChangeFeedHandler_completes_without_side_effects()
    {
        NoOpAuditEventChangeFeedHandler sut = new();

        await sut.Invoking(
                s => s.HandleAsync(
                    [new AuditEventDocument { Id = "1", TenantId = Guid.NewGuid().ToString("N") }],
                    CancellationToken.None))
            .Should()
            .NotThrowAsync();
    }

    [Fact]
    public void EmptyPersistenceScopeContextProvider_returns_empty_scope()
    {
        EmptyPersistenceScopeContextProvider sut = new();

        sut.GetCurrentScope().TenantId.Should().Be(Guid.Empty);
        sut.ResolveCurrentScope().Scope.TenantId.Should().Be(Guid.Empty);
    }

    [Fact]
    public void RunConcurrencyConflictException_preserves_run_id()
    {
        Guid runId = Guid.NewGuid();
        RunConcurrencyConflictException sut = new(runId);

        sut.RunId.Should().Be(runId);
        sut.Message.Should().Contain(runId.ToString("D"));
    }

    [Fact]
    public void AuditEventDocument_exposes_json_properties()
    {
        AuditEventDocument document = new()
        {
            Id = "evt-1",
            TenantId = "tenant",
            WorkspaceId = "workspace",
            ProjectId = "project",
            EventType = "test",
            DataJson = """{"ok":true}""",
            CorrelationId = "corr",
        };

        document.CorrelationId.Should().Be("corr");
        document.ExplicitActor.Should().BeFalse();
    }

    [Fact]
    public async Task BillingTrialConversionGate_allows_noop_provider_without_subscription()
    {
        Mock<IOptionsMonitor<BillingOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new BillingOptions { Provider = BillingProviderNames.Noop });
        Mock<IBillingLedger> ledger = new();
        BillingTrialConversionGate sut = new(options.Object, ledger.Object);

        await sut.Invoking(s => s.EnsureManualConversionAllowedAsync(Guid.NewGuid(), CancellationToken.None))
            .Should()
            .NotThrowAsync();
    }

    [Fact]
    public async Task BillingTrialConversionGate_blocks_when_paid_provider_without_subscription()
    {
        Mock<IOptionsMonitor<BillingOptions>> options = new();
        options.Setup(o => o.CurrentValue).Returns(new BillingOptions { Provider = "Stripe" });
        Mock<IBillingLedger> ledger = new();
        ledger.Setup(l => l.TenantHasActiveSubscriptionAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);
        BillingTrialConversionGate sut = new(options.Object, ledger.Object);
        Guid tenantId = Guid.NewGuid();

        Func<Task> act = () => sut.EnsureManualConversionAllowedAsync(tenantId, CancellationToken.None);

        await act.Should().ThrowAsync<BillingConversionBlockedException>();
    }

    [Fact]
    public async Task CachingPolicyPackRepository_returns_empty_for_empty_id_batch()
    {
        Mock<IPolicyPackRepository> inner = new();
        Mock<IHotPathReadCache> cache = new();
        CachingPolicyPackRepository sut = new(inner.Object, cache.Object);

        IReadOnlyList<PolicyPack> packs = await sut.GetByIdsAsync([], CancellationToken.None);

        packs.Should().BeEmpty();
        inner.VerifyNoOtherCalls();
    }

    [Fact]
    public void ArchitectureRunListItem_and_BackgroundJobRow_expose_init_properties()
    {
        ArchitectureRunListItem run = new()
        {
            RunId = "run-1",
            SystemName = "Payments",
            Status = "Completed",
        };
        BackgroundJobRow job = new()
        {
            JobId = "job-1",
            State = "Pending",
            CreatedUtc = DateTimeOffset.UtcNow,
        };

        run.SystemName.Should().Be("Payments");
        job.State.Should().Be("Pending");
    }
}
