using System.Globalization;

using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantTrialFacadeTests
{
    private sealed class FixedUtcTimeProvider(DateTimeOffset utcNow) : TimeProvider
    {
        public override DateTimeOffset GetUtcNow() => utcNow;
    }

    [Fact]
    public async Task GetTrialStatusAsync_reports_days_remaining_using_injected_clock()
    {
        DateTimeOffset anchor = DateTimeOffset.Parse("2026-05-01T00:00:00Z", CultureInfo.InvariantCulture);
        DateTimeOffset now = anchor.AddDays(3);
        TrialLifecycleSchedulerOptions lifecycleOptions = new();
        int? expectedDays = TrialLifecyclePolicy.ComputeDaysRemainingForStatusDisplay(
            new TenantRecord
            {
                Id = Guid.NewGuid(),
                Name = "n",
                Slug = "s",
                Tier = TenantTier.Standard,
                CreatedUtc = anchor,
                TrialStatus = TrialLifecycleStatus.Expired,
                TrialExpiresUtc = anchor,
            },
            now,
            lifecycleOptions);

        expectedDays.Should().NotBeNull().And.BeGreaterThan(0);

        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-1111-2222-3333-444444444444"),
            WorkspaceId = Guid.Parse("bbbbbbbb-1111-2222-3333-555555555555"),
            ProjectId = Guid.Parse("cccccccc-1111-2222-3333-666666666666"),
        };

        TenantRecord tenant = new()
        {
            Id = scope.TenantId,
            Name = "t",
            Slug = "t",
            Tier = TenantTier.Standard,
            CreatedUtc = anchor,
            TrialStatus = TrialLifecycleStatus.Expired,
            TrialExpiresUtc = anchor,
        };

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> schedulerOpts = new();
        schedulerOpts.Setup(o => o.CurrentValue).Returns(lifecycleOptions);

        TenantTrialFacade facade = TenantTrialFacadeTestSupport.Create(
            tenants.Object,
            scopeProvider.Object,
            audit: Mock.Of<Core.Audit.IAuditService>(),
            gate: Mock.Of<IBillingTrialConversionGate>(),
            trialUsers: Mock.Of<ITrialIdentityUserRepository>(),
            trialAbuseRepository: Mock.Of<ISelfServiceTrialAbuseRepository>(),
            schedulerOpts.Object,
            new FixedUtcTimeProvider(now));

        TenantTrialStatusQueryResult result = await facade.GetTrialStatusAsync(CancellationToken.None);

        result.Outcome.Should().Be(TenantTrialHttpOutcome.Success);
        result.Status!.DaysRemaining.Should().Be(expectedDays);
    }

    [SkippableFact]
    public async Task GetTrialStatusAsync_sets_identity_handoff_pending_when_converted_status_differs_only_by_casing()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-1111-2222-3333-444444444444"),
            WorkspaceId = Guid.Parse("bbbbbbbb-1111-2222-3333-555555555555"),
            ProjectId = Guid.Parse("cccccccc-1111-2222-3333-666666666666"),
        };

        TenantRecord tenant = new()
        {
            Id = scope.TenantId,
            Name = "t",
            Slug = "t",
            Tier = TenantTier.Standard,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialRunsUsed = 0,
            TrialSeatsUsed = 0,
            TrialStatus = "converted",
            EntraTenantId = null,
        };

        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        Mock<IBillingTrialConversionGate> gate = new();
        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> schedulerOpts = new();
        schedulerOpts.Setup(o => o.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        TenantTrialFacade facade = TenantTrialFacadeTestSupport.Create(
            tenants.Object,
            scopeProvider.Object,
            audit: Mock.Of<Core.Audit.IAuditService>(),
            gate.Object,
            trialUsers: Mock.Of<ITrialIdentityUserRepository>(),
            trialAbuseRepository: Mock.Of<ISelfServiceTrialAbuseRepository>(),
            schedulerOpts.Object);

        TenantTrialStatusQueryResult result = await facade.GetTrialStatusAsync(CancellationToken.None);

        result.Outcome.Should().Be(TenantTrialHttpOutcome.Success);
        result.Status.Should().NotBeNull();
        result.Status!.IdentityHandoffPending.Should().BeTrue(
            "legacy or import rows may store non-canonical Converted casing after lifecycle parity fixes elsewhere");
    }

    [Fact]
    public async Task LinkEntraAsync_when_trial_status_is_active_returns_conflict_without_binding_directory()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-1111-2222-3333-444444444444"),
            WorkspaceId = Guid.Parse("bbbbbbbb-1111-2222-3333-555555555555"),
            ProjectId = Guid.Parse("cccccccc-1111-2222-3333-666666666666"),
        };

        TenantRecord tenant = new()
        {
            Id = scope.TenantId,
            Name = "t",
            Slug = "t",
            Tier = TenantTier.Standard,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialRunsUsed = 0,
            TrialSeatsUsed = 0,
            TrialStatus = TrialLifecycleStatus.Active,
            EntraTenantId = null,
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        Mock<IBillingTrialConversionGate> gate = new();
        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> schedulerOpts = new();
        schedulerOpts.Setup(o => o.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        TenantTrialFacade facade = TenantTrialFacadeTestSupport.Create(
            tenants.Object,
            scopeProvider.Object,
            audit: Mock.Of<Core.Audit.IAuditService>(),
            gate.Object,
            trialUsers: Mock.Of<ITrialIdentityUserRepository>(),
            trialAbuseRepository: Mock.Of<ISelfServiceTrialAbuseRepository>(),
            schedulerOpts.Object);

        TenantTrialLinkEntraResult result = await facade.LinkEntraAsync(
            new TenantTrialLinkEntraBody
            {
                EntraTenantId = Guid.Parse("dddddddd-1111-2222-3333-777777777777"),
            },
            actor: "admin@customer.com",
            CancellationToken.None);

        result.Outcome.Should().Be(TenantTrialHttpOutcome.Conflict);
        result.Message.Should().ContainEquivalentOf("converted");
        tenants.Verify(
            repository => repository.UpdateEntraTenantIdAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task LinkEntraAsync_when_trial_status_is_expired_returns_conflict_without_binding_directory()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-1111-2222-3333-444444444444"),
            WorkspaceId = Guid.Parse("bbbbbbbb-1111-2222-3333-555555555555"),
            ProjectId = Guid.Parse("cccccccc-1111-2222-3333-666666666666"),
        };

        TenantRecord tenant = new()
        {
            Id = scope.TenantId,
            Name = "t",
            Slug = "t",
            Tier = TenantTier.Standard,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialRunsUsed = 0,
            TrialSeatsUsed = 0,
            TrialStatus = TrialLifecycleStatus.Expired,
            EntraTenantId = null,
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        TenantTrialFacade facade = TenantTrialFacadeTestSupport.Create(
            tenants.Object,
            scopeProvider.Object,
            audit: Mock.Of<Core.Audit.IAuditService>(),
            gate: Mock.Of<IBillingTrialConversionGate>(),
            trialUsers: Mock.Of<ITrialIdentityUserRepository>(),
            trialAbuseRepository: Mock.Of<ISelfServiceTrialAbuseRepository>(),
            schedulerOpts: Mock.Of<IOptionsMonitor<TrialLifecycleSchedulerOptions>>());

        TenantTrialLinkEntraResult result = await facade.LinkEntraAsync(
            new TenantTrialLinkEntraBody
            {
                EntraTenantId = Guid.Parse("dddddddd-1111-2222-3333-777777777777"),
            },
            actor: "admin@customer.com",
            CancellationToken.None);

        result.Outcome.Should().Be(TenantTrialHttpOutcome.Conflict);
        result.Message.Should().ContainEquivalentOf("converted");
        tenants.Verify(
            repository => repository.UpdateEntraTenantIdAsync(
                It.IsAny<Guid>(),
                It.IsAny<Guid>(),
                It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task LinkEntraAsync_when_trial_status_is_lowercase_active_returns_conflict()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-1111-2222-3333-444444444444"),
            WorkspaceId = Guid.Parse("bbbbbbbb-1111-2222-3333-555555555555"),
            ProjectId = Guid.Parse("cccccccc-1111-2222-3333-666666666666"),
        };

        TenantRecord tenant = new()
        {
            Id = scope.TenantId,
            Name = "t",
            Slug = "t",
            Tier = TenantTier.Standard,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialRunsUsed = 0,
            TrialSeatsUsed = 0,
            TrialStatus = "active",
            EntraTenantId = null,
        };

        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);

        TenantTrialFacade facade = TenantTrialFacadeTestSupport.Create(
            tenants.Object,
            scopeProvider.Object,
            audit: Mock.Of<Core.Audit.IAuditService>(),
            gate: Mock.Of<IBillingTrialConversionGate>(),
            trialUsers: Mock.Of<ITrialIdentityUserRepository>(),
            trialAbuseRepository: Mock.Of<ISelfServiceTrialAbuseRepository>(),
            schedulerOpts: Mock.Of<IOptionsMonitor<TrialLifecycleSchedulerOptions>>());

        TenantTrialLinkEntraResult result = await facade.LinkEntraAsync(
            new TenantTrialLinkEntraBody
            {
                EntraTenantId = Guid.Parse("dddddddd-1111-2222-3333-777777777777"),
            },
            actor: "admin@customer.com",
            CancellationToken.None);

        result.Outcome.Should().Be(TenantTrialHttpOutcome.Conflict);
    }
}
