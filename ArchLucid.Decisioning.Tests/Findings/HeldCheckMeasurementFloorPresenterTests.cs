using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

public sealed class HeldCheckMeasurementFloorPresenterTests
{
    [Fact]
    public void Present_includes_unblock_clause_when_top_code_unblocks_at_least_two_engines()
    {
        InsightDensityMeasurementFloorContext context = new()
        {
            HeldCheckLedgerEntries =
            [
                new HeldCheckLedgerRollupEntry
                {
                    InputCode = HeldCheckInputCode.AzureInventoryZip,
                    EngineCount = 7,
                    EngineTypes = ["secrets-lifecycle", "orphaned-azure-resource"],
                },
                new HeldCheckLedgerRollupEntry
                {
                    InputCode = HeldCheckInputCode.ActorNodes,
                    EngineCount = 3,
                    EngineTypes = ["identity-blast-radius"],
                },
            ],
        };

        InsightDensityMeasurementFloorPresentation presentation =
            InsightDensityMeasurementFloorPresenter.Present(measuredEnginesSucceeded: 12, context);

        presentation.TopHeldCheckUnblockClause.Should().Contain("Azure inventory ZIP");
        presentation.TopHeldCheckUnblockClause.Should().Contain("7 engines");
        presentation.Sentence.Should().Contain("Uploading Azure inventory ZIP would unblock 7 engines.");
        presentation.HeldCheckLedgerEntries.Should().HaveCount(2);
    }

    [Fact]
    public void Present_omits_unblock_clause_when_top_code_unblocks_one_engine()
    {
        InsightDensityMeasurementFloorContext context = new()
        {
            HeldCheckLedgerEntries =
            [
                new HeldCheckLedgerRollupEntry
                {
                    InputCode = HeldCheckInputCode.AzureInventoryZip,
                    EngineCount = 1,
                    EngineTypes = ["secrets-lifecycle"],
                },
            ],
        };

        InsightDensityMeasurementFloorPresentation presentation =
            InsightDensityMeasurementFloorPresenter.Present(measuredEnginesSucceeded: 12, context);

        presentation.TopHeldCheckUnblockClause.Should().BeNull();
        presentation.Sentence.Should().NotContain("Uploading");
    }

    [Fact]
    public void Present_includes_second_pass_clause_when_completed_with_decision_grade_findings()
    {
        InsightDensityMeasurementFloorContext context = new()
        {
            HeldCheckSecondPass = new HeldCheckSecondPassSummary
            {
                InputCode = HeldCheckInputCode.AzureInventoryZip,
                Status = HeldCheckSecondPassStatus.Completed,
                UnblockedEngineCount = 2,
                NewDecisionGradeCount = 1,
            },
        };

        InsightDensityMeasurementFloorPresentation presentation =
            InsightDensityMeasurementFloorPresenter.Present(measuredEnginesSucceeded: 12, context);

        presentation.HeldCheckSecondPassClause.Should().Contain("Azure inventory ZIP");
        presentation.HeldCheckSecondPassClause.Should().Contain("2 previously held engines");
        presentation.Sentence.Should().Contain("Re-ran after Azure inventory ZIP");
    }

    [Fact]
    public void Present_null_run_keeps_dx15_copy_without_held_check_clause()
    {
        InsightDensityMeasurementFloorPresentation presentation =
            InsightDensityMeasurementFloorPresenter.Present(measuredEnginesSucceeded: null);

        presentation.HeldCheckLedgerEntries.Should().BeEmpty();
        presentation.Sentence.Should().Contain("no measured engine coverage");
        presentation.Sentence.Should().NotContain("Uploading");
    }
}
