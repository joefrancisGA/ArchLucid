using System.Globalization;

using ArchLucid.Contracts.Risk;
using ArchLucid.Decisioning.Risk;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Risk;

[Trait("Category", "Unit")]
public sealed class TradeoffRequirementConflictDetectorTests
{
    [Fact]
    public void DetectConflict_does_not_false_positive_on_budgetary_requirement_when_cost_sacrificed()
    {
        (bool IsConflicting, string? RequirementId) result = TradeoffRequirementConflictDetector.DetectConflict(
            WafPillar.Cost,
            ["Annual budgetary forecast review only"]);

        result.IsConflicting.Should().BeFalse();
        result.RequirementId.Should().BeNull();
    }

    [Fact]
    public void DetectConflict_does_not_false_positive_on_non_pci_requirement_when_security_sacrificed()
    {
        (bool IsConflicting, string? RequirementId) result = TradeoffRequirementConflictDetector.DetectConflict(
            WafPillar.Security,
            ["Workload must remain non-pci scoped"]);

        result.IsConflicting.Should().BeFalse();
        result.RequirementId.Should().BeNull();
    }

    [Fact]
    public void DetectConflict_does_not_treat_99_5_percent_availability_as_strict_when_dot_is_group_separator()
    {
        CultureInfo original = CultureInfo.CurrentCulture;
        CultureInfo grouped = (CultureInfo)CultureInfo.InvariantCulture.Clone();
        grouped.NumberFormat.NumberGroupSeparator = ".";
        grouped.NumberFormat.NumberDecimalSeparator = ",";

        try
        {
            CultureInfo.CurrentCulture = grouped;

            (bool IsConflicting, string? RequirementId) result = TradeoffRequirementConflictDetector.DetectConflict(
                WafPillar.Reliability,
                ["Maintain 99.5% availability for the checkout API."]);

            result.IsConflicting.Should().BeFalse();
            result.RequirementId.Should().BeNull();
        }
        finally
        {
            CultureInfo.CurrentCulture = original;
        }
    }
}
