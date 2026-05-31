using ArchLucid.Core.Governance;
using Disposition = ArchLucid.Contracts.Findings.FindingDisposition;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Governance;

[Trait("Category", "Unit")]
public sealed class ArchitectureRiskRegisterStaleEvaluatorTests
{
    private static readonly DateTimeOffset Now = new(2026, 5, 31, 12, 0, 0, TimeSpan.Zero);

    [Fact]
    public void IsStale_returns_false_when_active_waiver_covers_deferred_revisit()
    {
        bool stale = ArchitectureRiskRegisterStaleEvaluator.IsStale(
            Disposition.Deferred,
            revisitDueUtc: Now.AddDays(-1),
            waiverExpiresAtUtc: Now.AddDays(30),
            Now);

        stale.Should().BeFalse();
    }

    [Fact]
    public void IsStale_returns_true_when_deferred_revisit_past_due_without_waiver()
    {
        bool stale = ArchitectureRiskRegisterStaleEvaluator.IsStale(
            Disposition.Deferred,
            revisitDueUtc: Now.AddDays(-1),
            waiverExpiresAtUtc: null,
            Now);

        stale.Should().BeTrue();
    }

    [Fact]
    public void IsStale_returns_true_when_waiver_expired()
    {
        bool stale = ArchitectureRiskRegisterStaleEvaluator.IsStale(
            Disposition.Accepted,
            revisitDueUtc: null,
            waiverExpiresAtUtc: Now.AddDays(-1),
            Now);

        stale.Should().BeTrue();
    }
}
