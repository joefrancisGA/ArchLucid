using ArchLucid.Core.Comparison;
using ArchLucid.Decisioning.Advisory.Analysis;
using ArchLucid.Decisioning.Advisory.Models;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Advisory;

[Trait("Category", "Unit")]
public sealed class SecurityDeltaRegressionClassifierTests
{
    [Fact]
    public void IsRegression_information_only_to_partial_is_not_regression()
    {
        SecurityDelta delta = new()
        {
            ControlName = "Data classification",
            BaseStatus = "Information only",
            TargetStatus = "Partial",
        };

        SecurityDeltaRegressionClassifier.IsRegression(delta).Should().BeFalse();
    }

    [Fact]
    public void IsRegression_compliant_to_not_compliant_is_regression()
    {
        SecurityDelta delta = new()
        {
            ControlName = "Encryption",
            BaseStatus = "Compliant",
            TargetStatus = "Not Compliant",
        };

        SecurityDeltaRegressionClassifier.IsRegression(delta).Should().BeTrue();
    }

    [Fact]
    public void CountRegressions_security_improvements_not_counted()
    {
        IEnumerable<SecurityDelta> deltas =
        [
            new SecurityDelta { BaseStatus = "NonCompliant", TargetStatus = "Compliant" },
            new SecurityDelta { BaseStatus = "Compliant", TargetStatus = "NonCompliant" }
        ];

        SecurityDeltaRegressionClassifier.CountRegressions(deltas).Should().Be(1);
    }

    [Fact]
    public void IsRegression_bypass_status_does_not_rank_as_pass()
    {
        SecurityDelta delta = new()
        {
            ControlName = "WAF",
            BaseStatus = "Bypass",
            TargetStatus = "Compliant",
        };

        SecurityDeltaRegressionClassifier.IsRegression(delta).Should().BeFalse();
    }

    [Fact]
    public void IsRegression_gap_remediation_planned_from_compliant_is_not_regression()
    {
        SecurityDelta delta = new()
        {
            ControlName = "Encryption",
            BaseStatus = "Compliant",
            TargetStatus = "Gap remediation planned",
        };

        SecurityDeltaRegressionClassifier.IsRegression(delta).Should().BeFalse();
    }
}
