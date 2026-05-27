using ArchLucid.Persistence.Tenancy.Diagnostics;

using FluentAssertions;

namespace ArchLucid.Persistence.Tests.Tenancy;

public sealed class TrialFunnelOperationalSummaryBuilderTests
{
    [Fact]
    public void Build_empty_summary_labels_cogs_as_estimated()
    {
        var summary = TrialFunnelOperationalSummaryBuilder.BuildEmpty(activeTrials: 3);

        summary.ActiveSelfServiceTrials.Should().Be(3);
        summary.CogsBasisLabel.Should().Be("estimated");
        summary.EstimatedFirstReviewCogsUsdMid.Should().BeNull();
    }

    [Fact]
    public void TryReadSignupToCommitSeconds_parses_audit_payload()
    {
        string json = """{"signupToCommitSeconds": 42.5}""";

        bool ok = TrialFunnelOperationalSummaryBuilder.TryReadSignupToCommitSeconds(json, out double seconds);

        ok.Should().BeTrue();
        seconds.Should().Be(42.5);
    }
}
