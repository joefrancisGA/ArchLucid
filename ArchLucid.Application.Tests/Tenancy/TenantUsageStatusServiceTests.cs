using ArchLucid.Application.Tenancy;
using ArchLucid.Core.Billing;
using ArchLucid.Core.Tenancy;

using FluentAssertions;

using Moq;

namespace ArchLucid.Application.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TenantUsageStatusServiceTests
{
    [SkippableFact]
    public async Task BuildAsync_marks_active_trial_and_null_commercial_tier()
    {
        Guid tenantId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        TenantRecord tenant = new()
        {
            Id = tenantId,
            Name = "t",
            Slug = "t",
            Tier = TenantTier.Free,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialStatus = TrialLifecycleStatus.Active,
            TrialSeatsUsed = 3,
            TrialSeatsLimit = 5
        };
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        tenants.Setup(t => t.ListWorkspacesAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(Array.Empty<TenantWorkspaceListItem>());
        Mock<IBillingLedger> ledger = new();
        ledger.Setup(l => l.TryGetSubscriptionAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync((BillingSubscriptionSnapshot?)null);
        TenantUsageStatusService sut = new(tenants.Object, ledger.Object);

        TenantUsageStatusSnapshot? snapshot = await sut.BuildAsync(tenantId, CancellationToken.None);

        snapshot.Should().NotBeNull();
        snapshot!.IsTrial.Should().BeTrue();
        snapshot.CommercialTier.Should().BeNull();
        snapshot.SeatsUsed.Should().Be(3);
    }

    [SkippableFact]
    public async Task BuildAsync_returns_team_limits_for_paid_team_tenant()
    {
        Guid tenantId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc");
        TenantRecord tenant = new()
        {
            Id = tenantId,
            Name = "t",
            Slug = "t",
            Tier = TenantTier.Standard,
            CreatedUtc = TimeProvider.System.GetUtcNow(),
            TrialStatus = TrialLifecycleStatus.Converted,
            TrialSeatsUsed = 4
        };
        Mock<ITenantRepository> tenants = new();
        tenants.Setup(t => t.GetByIdAsync(tenantId, It.IsAny<CancellationToken>())).ReturnsAsync(tenant);
        tenants.Setup(t => t.ListWorkspacesAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(
            [
                new TenantWorkspaceListItem
                {
                    TenantId = tenantId,
                    WorkspaceId = Guid.NewGuid(),
                    Name = "w",
                    DefaultProjectId = Guid.NewGuid(),
                    CreatedUtc = TimeProvider.System.GetUtcNow()
                }
            ]);
        Mock<IBillingLedger> ledger = new();
        ledger.Setup(l => l.TryGetSubscriptionAsync(tenantId, It.IsAny<CancellationToken>()))
            .ReturnsAsync(new BillingSubscriptionSnapshot("noop", nameof(TenantTier.Standard), 3, 1, "Active"));
        TenantUsageStatusService sut = new(tenants.Object, ledger.Object);

        TenantUsageStatusSnapshot? snapshot = await sut.BuildAsync(tenantId, CancellationToken.None);

        snapshot.Should().NotBeNull();
        snapshot!.IsTrial.Should().BeFalse();
        snapshot.CommercialTier.Should().Be(CommercialPackagingTierLabels.Team);
        snapshot.SeatsUsed.Should().Be(4);
        snapshot.SeatsLimit.Should().Be(CommercialPackagingLimits.TeamSeatsIncluded);
        snapshot.WorkspacesUsed.Should().Be(1);
        snapshot.WorkspacesLimit.Should().Be(CommercialPackagingLimits.TeamWorkspacesIncluded);
    }
}
