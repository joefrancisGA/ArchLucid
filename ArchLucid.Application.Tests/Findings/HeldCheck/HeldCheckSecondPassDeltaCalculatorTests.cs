using ArchLucid.Application.Findings.HeldCheck;
using ArchLucid.Contracts.Findings;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Findings.HeldCheck;

[Trait("Category", "Unit")]
public sealed class HeldCheckSecondPassDeltaCalculatorTests
{
    [Fact]
    public void Compute_returns_empty_when_prior_ledger_missing_input_code()
    {
        FindingsSnapshot newSnapshot = new()
        {
            Findings =
            [
                CreateFinding("secrets-lifecycle"),
            ],
        };

        HeldCheckSecondPassDelta delta = HeldCheckSecondPassDeltaCalculator.Compute(
            [
                new HeldCheckLedgerRollupEntry
                {
                    InputCode = HeldCheckInputCode.ActorNodes,
                    EngineCount = 2,
                    EngineTypes = ["identity-blast-radius"],
                },
            ],
            HeldCheckInputCode.AzureInventoryZip,
            newSnapshot);

        delta.UnblockedEngineTypes.Should().BeEmpty();
        delta.NewDecisionGradeCount.Should().Be(0);
    }

    [Fact]
    public void Compute_counts_unblocked_engines_and_decision_grade_findings()
    {
        FindingsSnapshot newSnapshot = new()
        {
            Findings =
            [
                CreateFinding("secrets-lifecycle", FindingClassification.DecisionGradeFinding),
                CreateFinding("orphaned-azure-resource", FindingClassification.ChecklistCoverage),
            ],
        };

        HeldCheckSecondPassDelta delta = HeldCheckSecondPassDeltaCalculator.Compute(
            [
                new HeldCheckLedgerRollupEntry
                {
                    InputCode = HeldCheckInputCode.AzureInventoryZip,
                    EngineCount = 2,
                    EngineTypes = ["secrets-lifecycle", "orphaned-azure-resource"],
                },
            ],
            HeldCheckInputCode.AzureInventoryZip,
            newSnapshot);

        delta.UnblockedEngineTypes.Should().BeEquivalentTo(["secrets-lifecycle", "orphaned-azure-resource"]);
        delta.NewDecisionGradeCount.Should().Be(1);
    }

    private static Finding CreateFinding(string engineType, FindingClassification classification = FindingClassification.DecisionGradeFinding)
    {
        return new Finding
        {
            FindingId = Guid.NewGuid().ToString("D"),
            EngineType = engineType,
            Title = "test",
            Classification = classification,
        };
    }
}
