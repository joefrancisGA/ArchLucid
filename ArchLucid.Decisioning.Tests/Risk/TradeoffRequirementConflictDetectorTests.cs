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
}
