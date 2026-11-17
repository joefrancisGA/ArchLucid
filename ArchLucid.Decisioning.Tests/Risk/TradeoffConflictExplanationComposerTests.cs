using ArchLucid.Contracts.Risk;
using ArchLucid.Decisioning.Risk;

using FluentAssertions;

using System.Reflection;

namespace ArchLucid.Decisioning.Tests.Risk;

[Trait("Category", "Unit")]
public sealed class TradeoffConflictExplanationComposerTests
{
    [Fact]
    public void BuildUserPrompt_uses_not_stored_copy_for_missing_requirement_and_counterfactual()
    {
        var tradeoff = new ArchitectureTradeoff
        {
            Mechanism = "cost-vs-reliability",
            GainedPillar = WafPillar.Cost,
            SacrificedPillar = WafPillar.Reliability,
            Status = TradeoffStatus.Conflicting,
            ConflictingRequirementId = "req-99",
            CounterfactualRef = null,
        };

        string prompt = InvokeBuildUserPrompt(tradeoff, statedRequirements: []);

        prompt.Should().Contain("Conflicting requirement: Conflicting requirement was not stored.");
        prompt.Should().Contain("Counterfactual mechanism: Counterfactual mechanism was not stored.");
        prompt.Should().Contain("Counterfactual key: Counterfactual key was not stored.");
        prompt.Should().NotContain("unknown");
        prompt.Should().NotContain("none");
    }

    private static string InvokeBuildUserPrompt(ArchitectureTradeoff tradeoff, IReadOnlyList<string> statedRequirements)
    {
        MethodInfo? method = typeof(TradeoffConflictExplanationComposer).GetMethod(
            "BuildUserPrompt",
            BindingFlags.Static | BindingFlags.NonPublic);

        method.Should().NotBeNull();

        return (string)method!.Invoke(
            null,
            [tradeoff, null, null, statedRequirements])!;
    }
}
