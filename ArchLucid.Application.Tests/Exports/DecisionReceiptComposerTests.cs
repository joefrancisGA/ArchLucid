using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Drafts;
using ArchLucid.Contracts.Exports;
using ArchLucid.Application.Exports;

using FluentAssertions;

namespace ArchLucid.Application.Tests.Exports;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class DecisionReceiptComposerTests
{
    [Theory]
    [InlineData(FeasibilityVerdictKind.SoftInfeasible, true)]
    [InlineData(FeasibilityVerdictKind.HardInfeasible, true)]
    [InlineData(FeasibilityVerdictKind.Feasible, false)]
    public void IsExportableVerdict_MatchesInfeasibleKinds(FeasibilityVerdictKind kind, bool expected)
    {
        DecisionReceiptComposer.IsExportableVerdict(kind).Should().Be(expected);
    }

    [Fact]
    public void BuildForDraft_EmbedsIntakeAndCostStory()
    {
        DraftRequestResponse draft = new()
        {
            DraftId = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            Status = DraftRequestStatus.Redirected,
            RedirectReason = "Business outcome required.",
            Document = new DraftRequestDocument
            {
                FreeTextIntent = "Build a workflow.",
                BusinessOutcome = "Reduce triage time.",
                SystemName = "Triage Hub",
            },
        };

        FeasibilityVerdict verdict = new()
        {
            Kind = FeasibilityVerdictKind.SoftInfeasible,
            Summary = "Business outcome required.",
        };

        DecisionReceiptDocument receipt = DecisionReceiptComposer.BuildForDraft(draft, verdict);

        receipt.SchemaVersion.Should().Be(DecisionReceiptConstants.SchemaVersion);
        receipt.Source.Should().Be(DecisionReceiptSource.DraftAdmission);
        receipt.DraftId.Should().Be(draft.DraftId);
        receipt.Intake.Should().NotBeNull();
        receipt.Intake!.BusinessOutcome.Should().Be("Reduce triage time.");
        receipt.CostStory.Label.Should().Be(DecisionReceiptConstants.CostEstimateLabel);
    }
}
