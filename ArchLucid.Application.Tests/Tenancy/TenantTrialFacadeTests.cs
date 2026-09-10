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
}
