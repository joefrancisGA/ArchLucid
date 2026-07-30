using ArchLucid.Core.Tenancy;

using FluentAssertions;

namespace ArchLucid.Core.Tests.Tenancy;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class TrialRunQuotaTests
{
    [Fact]
    public void ShouldConsumeAllowanceOnCreate_is_true_for_ordinary_runs()
    {
        TrialRunQuota.ShouldConsumeAllowanceOnCreate(false, false, "req-1").Should().BeTrue();
        TrialRunQuota.ShouldConsumeAllowanceOnCreate(false, false, null).Should().BeTrue();
    }

    [Fact]
    public void ShouldConsumeAllowanceOnCreate_is_false_for_sample_or_demo_welcome()
    {
        TrialRunQuota.ShouldConsumeAllowanceOnCreate(true, false, "req-1").Should().BeFalse();
        TrialRunQuota.ShouldConsumeAllowanceOnCreate(false, true, "req-1").Should().BeFalse();
    }

    [Fact]
    public void ShouldConsumeAllowanceOnCreate_is_false_for_trial_welcome_preseed_request_ids()
    {
        TrialRunQuota
            .ShouldConsumeAllowanceOnCreate(false, false, "trial-welcome-0123456789abcdef0123456789abcdef")
            .Should()
            .BeFalse();
    }
}
