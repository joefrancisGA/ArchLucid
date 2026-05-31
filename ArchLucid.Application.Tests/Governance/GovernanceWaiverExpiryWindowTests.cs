using ArchLucid.Application.Governance;
using ArchLucid.Contracts.Governance;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class GovernanceWaiverExpiryWindowTests
{
    private static readonly DateTimeOffset Now = new(2026, 5, 31, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void CountExpiringWithinDays_excludes_already_expired()
    {
        IReadOnlyList<RiskExceptionRecord> waivers =
        [
            Waiver(expiresAt: Now.AddDays(-1)),
        ];

        int count = GovernanceWaiverExpiryWindow.CountExpiringWithinDays(waivers, Now, days: 14);

        count.Should().Be(0);
    }

    [Fact]
    public void CountExpiringWithinDays_includes_expiry_at_window_end()
    {
        IReadOnlyList<RiskExceptionRecord> waivers =
        [
            Waiver(expiresAt: Now.AddDays(14)),
        ];

        int count = GovernanceWaiverExpiryWindow.CountExpiringWithinDays(waivers, Now, days: 14);

        count.Should().Be(1);
    }

    [Fact]
    public void CountExpiringWithinDays_excludes_expiry_after_window_end()
    {
        IReadOnlyList<RiskExceptionRecord> waivers =
        [
            Waiver(expiresAt: Now.AddDays(14).AddSeconds(1)),
        ];

        int count = GovernanceWaiverExpiryWindow.CountExpiringWithinDays(waivers, Now, days: 14);

        count.Should().Be(0);
    }

    private static RiskExceptionRecord Waiver(DateTimeOffset expiresAt) =>
        new()
        {
            RiskExceptionId = Guid.NewGuid(),
            TenantId = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            WorkspaceId = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            ProjectId = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            FindingId = "finding-1",
            OwnerUserId = "owner",
            ExpiresAtUtc = expiresAt,
            Status = RiskExceptionStatus.Active,
            CreatedAtUtc = Now.AddDays(-30),
            CreatedByUserId = "creator",
        };
}
