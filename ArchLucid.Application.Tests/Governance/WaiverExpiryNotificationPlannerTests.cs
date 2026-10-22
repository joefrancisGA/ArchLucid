using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class WaiverExpiryNotificationPlannerTests
{
    private static readonly DateTimeOffset NowUtc = new(2026, 8, 12, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void Plan_skips_waivers_expiring_beyond_the_widest_boundary()
    {
        IReadOnlyList<WaiverExpiryNotification> planned =
            WaiverExpiryNotificationPlanner.Plan([Waiver(daysUntilExpiry: 60)], NowUtc);

        planned.Should().BeEmpty();
    }

    [Fact]
    public void Plan_skips_revoked_and_expired_waivers()
    {
        IReadOnlyList<RiskExceptionRecord> waivers =
        [
            Waiver(daysUntilExpiry: 3, status: RiskExceptionStatus.Revoked),
            Waiver(daysUntilExpiry: 3, status: RiskExceptionStatus.Expired),
        ];

        IReadOnlyList<WaiverExpiryNotification> planned = WaiverExpiryNotificationPlanner.Plan(waivers, NowUtc);

        planned.Should().BeEmpty();
    }

    [Fact]
    public void Plan_reports_boundary_and_actual_days_separately()
    {
        IReadOnlyList<WaiverExpiryNotification> planned =
            WaiverExpiryNotificationPlanner.Plan([Waiver(daysUntilExpiry: 12)], NowUtc);

        planned.Should().HaveCount(1);
        planned[0].BoundaryDays.Should().Be(14);
        planned[0].DaysRemaining.Should().Be(12);
    }

    [Fact]
    public void Plan_includes_active_waivers_already_past_expiry()
    {
        IReadOnlyList<WaiverExpiryNotification> planned =
            WaiverExpiryNotificationPlanner.Plan([Waiver(daysUntilExpiry: -4)], NowUtc);

        planned.Should().HaveCount(1);
        planned[0].BoundaryDays.Should().Be(0);
        planned[0].DaysRemaining.Should().Be(-4);
    }

    [Fact]
    public void Plan_returns_one_entry_per_qualifying_waiver()
    {
        IReadOnlyList<RiskExceptionRecord> waivers =
        [
            Waiver(daysUntilExpiry: 29),
            Waiver(daysUntilExpiry: 6),
            Waiver(daysUntilExpiry: 90),
        ];

        IReadOnlyList<WaiverExpiryNotification> planned = WaiverExpiryNotificationPlanner.Plan(waivers, NowUtc);

        planned.Select(static notification => notification.BoundaryDays).Should().Equal(30, 7);
    }

    [Fact]
    public void Plan_rejects_null_input()
    {
        Action act = () => WaiverExpiryNotificationPlanner.Plan(null!, NowUtc);

        act.Should().Throw<ArgumentNullException>();
    }

    private static RiskExceptionRecord Waiver(
        int daysUntilExpiry,
        RiskExceptionStatus status = RiskExceptionStatus.Active)
    {
        return new RiskExceptionRecord
        {
            RiskExceptionId = Guid.NewGuid(),
            TenantId = Guid.NewGuid(),
            WorkspaceId = Guid.NewGuid(),
            ProjectId = Guid.NewGuid(),
            FindingId = "f-1",
            OwnerUserId = "owner@example.com",
            CreatedByUserId = "creator@example.com",
            Rationale = "Accepted for the pilot window.",
            ExpiresAtUtc = NowUtc.AddDays(daysUntilExpiry),
            Status = status,
            CreatedAtUtc = NowUtc.AddDays(-1),
        };
    }
}
