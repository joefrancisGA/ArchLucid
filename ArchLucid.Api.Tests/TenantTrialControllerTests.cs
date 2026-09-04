using ArchLucid.Api.Controllers.Tenancy;
using ArchLucid.Application.Tests.Tenancy;
using ArchLucid.Application.Tenancy;
using ArchLucid.Api.Models.Tenancy;
using ArchLucid.Core.Audit;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Configuration;
using ArchLucid.Core.Identity;
using ArchLucid.Core.Scoping;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;

using Moq;

namespace ArchLucid.Api.Tests;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantTrialControllerTests
{
    [SkippableFact]
    public async Task GetTrialStatusAsync_returns_not_found_when_tenant_missing()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc")
        };
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        Mock<IAuditService> audit = new();
        Mock<IBillingTrialConversionGate> gate = new();
        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> schedulerOpts = new();
        schedulerOpts.Setup(o => o.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        TenantTrialController sut = CreateController(
            tenants.Object,
            scopeProvider.Object,
            audit.Object,
            gate.Object,
            NoopTrialIdentityUsers(),
            schedulerOpts.Object);

        IActionResult result = await sut.GetTrialStatusAsync(CancellationToken.None);

        ObjectResult problem = result.Should().BeOfType<ObjectResult>().Subject;
        problem.StatusCode.Should().Be(StatusCodes.Status404NotFound);
    }

    [SkippableFact]
    public async Task GetTrialStatusAsync_returns_none_when_trial_status_blank()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            WorkspaceId = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            ProjectId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff")
        };
        TenantRecord tenant = new()
        {
            Id = scope.TenantId,
            Name = "t",
            Slug = "t",
            Tier = TenantTier.Free,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialRunsUsed = 1,
            TrialSeatsUsed = 0,
            TrialStatus = "   "
        };
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        Mock<IAuditService> audit = new();
        Mock<IBillingTrialConversionGate> gate = new();
        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> schedulerOpts = new();
        schedulerOpts.Setup(o => o.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        TenantTrialController sut = CreateController(
            tenants.Object,
            scopeProvider.Object,
            audit.Object,
            gate.Object,
            NoopTrialIdentityUsers(),
            schedulerOpts.Object);

        IActionResult result = await sut.GetTrialStatusAsync(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        TenantTrialStatusResponse body = ok.Value.Should().BeOfType<TenantTrialStatusResponse>().Subject;
        body.Status.Should().Be("None");
        body.TrialRunsUsed.Should().Be(1);
        body.FirstCommitUtc.Should().BeNull();
    }

    [SkippableFact]
    public async Task GetTrialStatusAsync_echoes_first_commit_utc_on_none_branch_when_set()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
            WorkspaceId = Guid.Parse("bbbbbbbb-cccc-dddd-eeee-ffffffffffff"),
            ProjectId = Guid.Parse("cccccccc-dddd-eeee-ffff-000000000000")
        };
        DateTimeOffset created = TimeProvider.System.GetUtcNow().AddDays(-2);
        DateTimeOffset committed = created.AddHours(6);
        TenantRecord tenant = new()
        {
            Id = scope.TenantId,
            Name = "t",
            Slug = "t",
            Tier = TenantTier.Standard,
            CreatedUtc = created,
            TrialRunsUsed = 0,
            TrialSeatsUsed = 0,
            TrialStatus = "   ",
            TrialFirstManifestCommittedUtc = committed
        };
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        Mock<IAuditService> audit = new();
        Mock<IBillingTrialConversionGate> gate = new();
        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> schedulerOpts = new();
        schedulerOpts.Setup(o => o.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        TenantTrialController sut = CreateController(
            tenants.Object,
            scopeProvider.Object,
            audit.Object,
            gate.Object,
            NoopTrialIdentityUsers(),
            schedulerOpts.Object);

        IActionResult result = await sut.GetTrialStatusAsync(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        TenantTrialStatusResponse body = ok.Value.Should().BeOfType<TenantTrialStatusResponse>().Subject;
        body.Status.Should().Be("None");
        body.FirstCommitUtc.Should().Be(committed);
        body.TimeToFirstCommittedManifestTotalSeconds.Should().BeApproximately(6 * 3600, 1);
    }

    [SkippableFact]
    public async Task GetTrialStatusAsync_echoes_first_commit_utc_on_active_branch()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("dddddddd-eeee-ffff-0000-111111111111"),
            WorkspaceId = Guid.Parse("eeeeeeee-ffff-0000-1111-222222222222"),
            ProjectId = Guid.Parse("ffffffff-0000-1111-2222-333333333333")
        };
        DateTimeOffset expires = TimeProvider.System.GetUtcNow().AddDays(9);
        DateTimeOffset trialStart = TimeProvider.System.GetUtcNow().AddDays(-1);
        DateTimeOffset committed = trialStart.AddHours(4);
        TenantRecord tenant = new()
        {
            Id = scope.TenantId,
            Name = "t",
            Slug = "t",
            Tier = TenantTier.Free,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialRunsUsed = 0,
            TrialSeatsUsed = 0,
            TrialStatus = TrialLifecycleStatus.Active,
            TrialStartUtc = trialStart,
            TrialExpiresUtc = expires,
            TrialRunsLimit = 5,
            TrialSeatsLimit = 10,
            TrialFirstManifestCommittedUtc = committed
        };
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        Mock<IAuditService> audit = new();
        Mock<IBillingTrialConversionGate> gate = new();
        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> schedulerOpts = new();
        schedulerOpts.Setup(o => o.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        TenantTrialController sut = CreateController(
            tenants.Object,
            scopeProvider.Object,
            audit.Object,
            gate.Object,
            NoopTrialIdentityUsers(),
            schedulerOpts.Object);

        IActionResult result = await sut.GetTrialStatusAsync(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        TenantTrialStatusResponse body = ok.Value.Should().BeOfType<TenantTrialStatusResponse>().Subject;
        body.Status.Should().Be(TrialLifecycleStatus.Active);
        body.FirstCommitUtc.Should().Be(committed);
        body.TimeToFirstCommittedManifestTotalSeconds.Should().BeApproximately(4 * 3600, 1);
    }

    [SkippableFact]
    public async Task GetTrialStatusAsync_identity_handoff_pending_true_when_converted_and_entra_unbound()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-1111-2222-3333-444444444444"),
            WorkspaceId = Guid.Parse("bbbbbbbb-1111-2222-3333-555555555555"),
            ProjectId = Guid.Parse("cccccccc-1111-2222-3333-666666666666")
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
            TrialStatus = TrialLifecycleStatus.Converted,
            EntraTenantId = null
        };
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        Mock<IAuditService> audit = new();
        Mock<IBillingTrialConversionGate> gate = new();
        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> schedulerOpts = new();
        schedulerOpts.Setup(o => o.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        TenantTrialController sut = CreateController(
            tenants.Object,
            scopeProvider.Object,
            audit.Object,
            gate.Object,
            NoopTrialIdentityUsers(),
            schedulerOpts.Object);

        IActionResult result = await sut.GetTrialStatusAsync(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        TenantTrialStatusResponse body = ok.Value.Should().BeOfType<TenantTrialStatusResponse>().Subject;
        body.IdentityHandoffPending.Should().BeTrue();
    }

    [SkippableFact]
    public async Task GetTrialStatusAsync_identity_handoff_pending_false_when_converted_and_entra_bound()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("dddddddd-1111-2222-3333-777777777777"),
            WorkspaceId = Guid.Parse("eeeeeeee-1111-2222-3333-888888888888"),
            ProjectId = Guid.Parse("ffffffff-1111-2222-3333-999999999999")
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
            TrialStatus = TrialLifecycleStatus.Converted,
            EntraTenantId = Guid.Parse("99999999-9999-9999-9999-999999999999")
        };
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        Mock<IAuditService> audit = new();
        Mock<IBillingTrialConversionGate> gate = new();
        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> schedulerOpts = new();
        schedulerOpts.Setup(o => o.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        TenantTrialController sut = CreateController(
            tenants.Object,
            scopeProvider.Object,
            audit.Object,
            gate.Object,
            NoopTrialIdentityUsers(),
            schedulerOpts.Object);

        IActionResult result = await sut.GetTrialStatusAsync(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        TenantTrialStatusResponse body = ok.Value.Should().BeOfType<TenantTrialStatusResponse>().Subject;
        body.IdentityHandoffPending.Should().BeFalse();
    }

    [SkippableFact]
    public async Task GetTrialStatusAsync_returns_active_payload_with_days_remaining()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333")
        };
        DateTimeOffset expires = TimeProvider.System.GetUtcNow().AddDays(9);
        TenantRecord tenant = new()
        {
            Id = scope.TenantId,
            Name = "t",
            Slug = "t",
            Tier = TenantTier.Free,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialRunsUsed = 0,
            TrialSeatsUsed = 0,
            TrialStatus = TrialLifecycleStatus.Active,
            TrialStartUtc = TimeProvider.System.GetUtcNow().AddDays(-1),
            TrialExpiresUtc = expires,
            TrialRunsLimit = 5,
            TrialSeatsLimit = 10
        };
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        Mock<IAuditService> audit = new();
        Mock<IBillingTrialConversionGate> gate = new();
        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> schedulerOpts = new();
        schedulerOpts.Setup(o => o.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        TenantTrialController sut = CreateController(
            tenants.Object,
            scopeProvider.Object,
            audit.Object,
            gate.Object,
            NoopTrialIdentityUsers(),
            schedulerOpts.Object);

        IActionResult result = await sut.GetTrialStatusAsync(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        TenantTrialStatusResponse body = ok.Value.Should().BeOfType<TenantTrialStatusResponse>().Subject;
        body.Status.Should().Be(TrialLifecycleStatus.Active);
        body.TrialExpiresUtc.Should().Be(expires);
        body.DaysRemaining.Should().NotBeNull();
        body.DaysRemaining!.Value.Should().BeGreaterThanOrEqualTo(8).And.BeLessThanOrEqualTo(10);
    }

    [SkippableFact]
    public async Task GetTrialStatusAsync_returns_null_days_remaining_when_converted()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333")
        };
        DateTimeOffset expires = TimeProvider.System.GetUtcNow().AddDays(30);
        TenantRecord tenant = new()
        {
            Id = scope.TenantId,
            Name = "t",
            Slug = "t",
            Tier = TenantTier.Standard,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialRunsUsed = 0,
            TrialSeatsUsed = 0,
            TrialStatus = TrialLifecycleStatus.Converted,
            TrialStartUtc = TimeProvider.System.GetUtcNow().AddDays(-14),
            TrialExpiresUtc = expires,
            EntraTenantId = Guid.Parse("44444444-4444-4444-4444-444444444444")
        };
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        Mock<IAuditService> audit = new();
        Mock<IBillingTrialConversionGate> gate = new();
        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> schedulerOpts = new();
        schedulerOpts.Setup(o => o.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        TenantTrialController sut = CreateController(
            tenants.Object,
            scopeProvider.Object,
            audit.Object,
            gate.Object,
            NoopTrialIdentityUsers(),
            schedulerOpts.Object);

        IActionResult result = await sut.GetTrialStatusAsync(CancellationToken.None);

        OkObjectResult ok = result.Should().BeOfType<OkObjectResult>().Subject;
        TenantTrialStatusResponse body = ok.Value.Should().BeOfType<TenantTrialStatusResponse>().Subject;
        body.Status.Should().Be(TrialLifecycleStatus.Converted);
        body.DaysRemaining.Should().BeNull();
    }

    [SkippableFact]
    public async Task ConvertTrialAsync_returns_bad_request_when_target_tier_unrecognized_and_tenant_missing()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };
        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        tenants
            .Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((TenantRecord?)null);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<IBillingTrialConversionGate> gate = new(MockBehavior.Strict);
        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> schedulerOpts = new();
        schedulerOpts.Setup(o => o.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        TenantTrialController sut = CreateController(
            tenants.Object,
            scopeProvider.Object,
            audit.Object,
            gate.Object,
            NoopTrialIdentityUsers(),
            schedulerOpts.Object);

        IActionResult result = await sut.ConvertTrialAsync(
            new TenantTrialConvertRequest { TargetTier = "EnterpriseTypo" },
            CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        tenants.Verify(
            t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task ConvertTrialAsync_returns_bad_request_when_target_tier_unrecognized()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };
        TenantRecord tenant = new()
        {
            Id = scope.TenantId,
            Name = "t",
            Slug = "t",
            Tier = TenantTier.Free,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialStatus = TrialLifecycleStatus.Active,
        };
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        Mock<IAuditService> audit = new();
        Mock<IBillingTrialConversionGate> gate = new();
        gate
            .Setup(g => g.EnsureManualConversionAllowedAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> schedulerOpts = new();
        schedulerOpts.Setup(o => o.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        TenantTrialController sut = CreateController(
            tenants.Object,
            scopeProvider.Object,
            audit.Object,
            gate.Object,
            NoopTrialIdentityUsers(),
            schedulerOpts.Object);

        IActionResult result = await sut.ConvertTrialAsync(
            new TenantTrialConvertRequest { TargetTier = "EnterpriseTypo" },
            CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        tenants.Verify(
            t => t.MarkTrialConvertedAsync(It.IsAny<Guid>(), It.IsAny<TenantTier?>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task ConvertTrialAsync_accepts_null_body_with_unspecified_tier()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            WorkspaceId = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            ProjectId = Guid.Parse("33333333-3333-3333-3333-333333333333"),
        };
        TenantRecord tenant = new()
        {
            Id = scope.TenantId,
            Name = "t",
            Slug = "t",
            Tier = TenantTier.Free,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialStatus = TrialLifecycleStatus.Active,
        };
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(scope.TenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        tenants
            .Setup(t => t.MarkTrialConvertedAsync(scope.TenantId, null, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        Mock<IAuditService> audit = new();
        Mock<IBillingTrialConversionGate> gate = new();
        gate
            .Setup(g => g.EnsureManualConversionAllowedAsync(scope.TenantId, It.IsAny<CancellationToken>()))
            .Returns(Task.CompletedTask);
        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> schedulerOpts = new();
        schedulerOpts.Setup(o => o.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        TenantTrialController sut = CreateController(
            tenants.Object,
            scopeProvider.Object,
            audit.Object,
            gate.Object,
            NoopTrialIdentityUsers(),
            schedulerOpts.Object);

        IActionResult result = await sut.ConvertTrialAsync(null, CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        tenants.Verify(
            t => t.MarkTrialConvertedAsync(scope.TenantId, null, It.IsAny<CancellationToken>()),
            Times.Once);
    }

    [Fact]
    public async Task LinkEntraAsync_returns_bad_request_when_local_email_not_claimed_for_tenant()
    {
        Guid callerTenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        ScopeContext scope = new()
        {
            TenantId = callerTenantId,
            WorkspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            ProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
        };
        TenantRecord tenant = new()
        {
            Id = callerTenantId,
            Name = "caller",
            Slug = "caller",
            Tier = TenantTier.Standard,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialStatus = TrialLifecycleStatus.Converted,
        };
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(callerTenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        Mock<IAuditService> audit = new();
        Mock<IBillingTrialConversionGate> gate = new();
        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> schedulerOpts = new();
        schedulerOpts.Setup(o => o.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        const string normalizedEmail = "VICTIM@CUSTOMER.COM";
        Mock<ITrialIdentityUserRepository> trialUsers = new();
        trialUsers
            .Setup(r => r.GetByNormalizedEmailAsync(normalizedEmail, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TrialIdentityUserRecord
                {
                    Id = Guid.NewGuid(),
                    NormalizedEmail = normalizedEmail,
                    Email = "victim@customer.com",
                });

        Mock<ISelfServiceTrialAbuseRepository> abuseRepository = new();
        abuseRepository
            .Setup(r => r.HasEmailClaimForTenantAsync(normalizedEmail, callerTenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(false);

        TenantTrialController sut = CreateController(
            tenants.Object,
            scopeProvider.Object,
            audit.Object,
            gate.Object,
            trialUsers.Object,
            schedulerOpts.Object,
            abuseRepository.Object);

        IActionResult result = await sut.LinkEntraAsync(
            new TenantLinkEntraRequest
            {
                EntraTenantId = Guid.Parse("88888888-8888-8888-8888-888888888888"),
                LocalEmail = "victim@customer.com",
                EntraOid = "oid-cross-tenant",
            },
            CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        tenants.Verify(
            t => t.UpdateEntraTenantIdAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
        trialUsers.Verify(
            r => r.TryLinkLocalIdentityToEntraAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task LinkEntraAsync_returns_bad_request_when_entra_tenant_id_is_empty_and_tenant_missing()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };
        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<IBillingTrialConversionGate> gate = new(MockBehavior.Strict);
        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> schedulerOpts = new();
        schedulerOpts.Setup(o => o.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        TenantTrialController sut = CreateController(
            tenants.Object,
            scopeProvider.Object,
            audit.Object,
            gate.Object,
            NoopTrialIdentityUsers(),
            schedulerOpts.Object);

        IActionResult result = await sut.LinkEntraAsync(
            new TenantLinkEntraRequest
            {
                EntraTenantId = Guid.Empty,
                LocalEmail = "admin@customer.com",
                EntraOid = "oid-home",
            },
            CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        tenants.Verify(
            t => t.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task LinkEntraAsync_returns_bad_request_when_local_email_without_entra_oid_and_tenant_missing()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };
        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<IBillingTrialConversionGate> gate = new(MockBehavior.Strict);
        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> schedulerOpts = new();
        schedulerOpts.Setup(o => o.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        TenantTrialController sut = CreateController(
            tenants.Object,
            scopeProvider.Object,
            audit.Object,
            gate.Object,
            NoopTrialIdentityUsers(),
            schedulerOpts.Object);

        IActionResult result = await sut.LinkEntraAsync(
            new TenantLinkEntraRequest
            {
                EntraTenantId = Guid.Parse("88888888-8888-8888-8888-888888888888"),
                LocalEmail = "admin@customer.com",
            },
            CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        tenants.Verify(
            t => t.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task LinkEntraAsync_returns_bad_request_when_entra_oid_exceeds_max_length_and_tenant_missing()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };
        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<IBillingTrialConversionGate> gate = new(MockBehavior.Strict);
        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> schedulerOpts = new();
        schedulerOpts.Setup(o => o.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        TenantTrialController sut = CreateController(
            tenants.Object,
            scopeProvider.Object,
            audit.Object,
            gate.Object,
            NoopTrialIdentityUsers(),
            schedulerOpts.Object);

        IActionResult result = await sut.LinkEntraAsync(
            new TenantLinkEntraRequest
            {
                EntraTenantId = Guid.Parse("88888888-8888-8888-8888-888888888888"),
                LocalEmail = "admin@customer.com",
                EntraOid = new string('o', TrialIdentityUserFieldLimits.LinkedEntraOidMaxLength + 1),
            },
            CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        tenants.Verify(
            t => t.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [SkippableFact]
    public async Task LinkEntraAsync_returns_bad_request_when_local_email_exceeds_max_length_and_tenant_missing()
    {
        ScopeContext scope = new()
        {
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
        };
        Mock<ITenantRepository> tenants = new(MockBehavior.Strict);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        Mock<IAuditService> audit = new(MockBehavior.Strict);
        Mock<IBillingTrialConversionGate> gate = new(MockBehavior.Strict);
        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> schedulerOpts = new();
        schedulerOpts.Setup(o => o.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        TenantTrialController sut = CreateController(
            tenants.Object,
            scopeProvider.Object,
            audit.Object,
            gate.Object,
            NoopTrialIdentityUsers(),
            schedulerOpts.Object);

        IActionResult result = await sut.LinkEntraAsync(
            new TenantLinkEntraRequest
            {
                EntraTenantId = Guid.Parse("88888888-8888-8888-8888-888888888888"),
                LocalEmail = new string('a', TrialIdentityUserFieldLimits.NormalizedEmailMaxLength) + "@customer.com",
                EntraOid = "oid-123",
            },
            CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        tenants.Verify(
            t => t.GetByIdAsync(It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task LinkEntraAsync_returns_bad_request_when_entra_oid_exceeds_max_length()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            ProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
        };
        TenantRecord tenant = new()
        {
            Id = tenantId,
            Name = "home",
            Slug = "home",
            Tier = TenantTier.Standard,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialStatus = TrialLifecycleStatus.Converted,
        };
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);

        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        Mock<IAuditService> audit = new();
        Mock<IBillingTrialConversionGate> gate = new();
        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> schedulerOpts = new();
        schedulerOpts.Setup(o => o.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        const string normalizedEmail = "ADMIN@CUSTOMER.COM";
        Mock<ITrialIdentityUserRepository> trialUsers = new();
        trialUsers
            .Setup(r => r.GetByNormalizedEmailAsync(normalizedEmail, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TrialIdentityUserRecord
                {
                    Id = Guid.NewGuid(),
                    NormalizedEmail = normalizedEmail,
                    Email = "admin@customer.com",
                });

        Mock<ISelfServiceTrialAbuseRepository> abuseRepository = new();
        abuseRepository
            .Setup(r => r.HasEmailClaimForTenantAsync(normalizedEmail, tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        TenantTrialController sut = CreateController(
            tenants.Object,
            scopeProvider.Object,
            audit.Object,
            gate.Object,
            trialUsers.Object,
            schedulerOpts.Object,
            abuseRepository.Object);

        IActionResult result = await sut.LinkEntraAsync(
            new TenantLinkEntraRequest
            {
                EntraTenantId = Guid.Parse("88888888-8888-8888-8888-888888888888"),
                LocalEmail = "admin@customer.com",
                EntraOid = new string('o', ArchLucid.Core.Identity.TrialIdentityUserFieldLimits.LinkedEntraOidMaxLength + 1),
            },
            CancellationToken.None);

        ObjectResult bad = result.Should().BeOfType<ObjectResult>().Subject;
        bad.StatusCode.Should().Be(StatusCodes.Status400BadRequest);
        tenants.Verify(
            t => t.UpdateEntraTenantIdAsync(It.IsAny<Guid>(), It.IsAny<Guid>(), It.IsAny<CancellationToken>()),
            Times.Never);
        trialUsers.Verify(
            r => r.TryLinkLocalIdentityToEntraAsync(It.IsAny<string>(), It.IsAny<string>(), It.IsAny<CancellationToken>()),
            Times.Never);
    }

    [Fact]
    public async Task LinkEntraAsync_links_local_identity_when_email_claimed_for_tenant()
    {
        Guid tenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
        ScopeContext scope = new()
        {
            TenantId = tenantId,
            WorkspaceId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            ProjectId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
        };
        TenantRecord tenant = new()
        {
            Id = tenantId,
            Name = "home",
            Slug = "home",
            Tier = TenantTier.Standard,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialStatus = TrialLifecycleStatus.Converted,
        };
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        tenants
            .Setup(t => t.UpdateEntraTenantIdAsync(tenantId, It.IsAny<Guid>(), It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);
        Mock<IScopeContextProvider> scopeProvider = new();
        scopeProvider.Setup(s => s.GetCurrentScope()).Returns(scope);
        Mock<IAuditService> audit = new();
        Mock<IBillingTrialConversionGate> gate = new();
        Mock<IOptionsMonitor<TrialLifecycleSchedulerOptions>> schedulerOpts = new();
        schedulerOpts.Setup(o => o.CurrentValue).Returns(new TrialLifecycleSchedulerOptions());

        const string normalizedEmail = "ADMIN@CUSTOMER.COM";
        Mock<ITrialIdentityUserRepository> trialUsers = new();
        trialUsers
            .Setup(r => r.GetByNormalizedEmailAsync(normalizedEmail, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
                new TrialIdentityUserRecord
                {
                    Id = Guid.NewGuid(),
                    NormalizedEmail = normalizedEmail,
                    Email = "admin@customer.com",
                });
        trialUsers
            .Setup(r => r.TryLinkLocalIdentityToEntraAsync(normalizedEmail, "oid-home", It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        Mock<ISelfServiceTrialAbuseRepository> abuseRepository = new();
        abuseRepository
            .Setup(r => r.HasEmailClaimForTenantAsync(normalizedEmail, tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(true);

        TenantTrialController sut = CreateController(
            tenants.Object,
            scopeProvider.Object,
            audit.Object,
            gate.Object,
            trialUsers.Object,
            schedulerOpts.Object,
            abuseRepository.Object);

        IActionResult result = await sut.LinkEntraAsync(
            new TenantLinkEntraRequest
            {
                EntraTenantId = Guid.Parse("88888888-8888-8888-8888-888888888888"),
                LocalEmail = "admin@customer.com",
                EntraOid = "oid-home",
            },
            CancellationToken.None);

        result.Should().BeOfType<NoContentResult>();
        trialUsers.Verify(
            r => r.TryLinkLocalIdentityToEntraAsync(normalizedEmail, "oid-home", It.IsAny<CancellationToken>()),
            Times.Once);
    }

    private static TenantTrialController CreateController(
        ITenantRepository tenants,
        IScopeContextProvider scopeProvider,
        IAuditService audit,
        IBillingTrialConversionGate gate,
        ITrialIdentityUserRepository trialUsers,
        IOptionsMonitor<TrialLifecycleSchedulerOptions> schedulerOpts,
        ISelfServiceTrialAbuseRepository? trialAbuseRepository = null) =>
        new(TenantTrialFacadeTestSupport.Create(
            tenants,
            scopeProvider,
            audit,
            gate,
            trialUsers,
            trialAbuseRepository ?? Mock.Of<ISelfServiceTrialAbuseRepository>(),
            schedulerOpts))
        {
            ControllerContext = new ControllerContext { HttpContext = new DefaultHttpContext() },
        };

    private static ITrialIdentityUserRepository NoopTrialIdentityUsers() => Mock.Of<ITrialIdentityUserRepository>();
}
