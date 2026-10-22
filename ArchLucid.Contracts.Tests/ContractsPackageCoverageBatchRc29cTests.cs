using ArchLucid.Contracts.Admin;
using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Alerts.Simulation;
using ArchLucid.Contracts.Architecture;
using ArchLucid.Contracts.Exports;
using ArchLucid.Contracts.Evolution;
using ArchLucid.Contracts.Persistence.Decisions;
using ArchLucid.Contracts.ProductLearning;
using ArchLucid.Contracts.ProductLearning.Planning;
using ArchLucid.Contracts.User;

using FluentAssertions;

namespace ArchLucid.Contracts.Tests;

/// <summary>RC29c package-coverage batch: canonical value constants, citation DTO, and guard-rejection enum.</summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class ContractsPackageCoverageBatchRc29cTests
{
    [Fact]
    public void AdminDeploymentStatusValues_exposes_canonical_agreement_and_overall_tokens()
    {
        AdminDeploymentStatusValues.Unknown.Should().Be("Unknown");
        AdminDeploymentStatusValues.AgreementMatch.Should().Be("Match");
        AdminDeploymentStatusValues.AgreementMismatch.Should().Be("Mismatch");
        AdminDeploymentStatusValues.AgreementPartial.Should().Be("Partial");
        AdminDeploymentStatusValues.OverallHealthy.Should().Be("Healthy");
        AdminDeploymentStatusValues.OverallWarning.Should().Be("Warning");
        AdminDeploymentStatusValues.OverallFailed.Should().Be("Failed");
    }

    [Fact]
    public void Evolution_and_product_learning_value_constants_are_non_empty()
    {
        EvolutionEvaluationModeValues.ReadOnlyArchitectureAnalysis.Should().Contain("ReadOnly");
        EvolutionCandidateChangeSetStatusValues.Draft.Should().Be("Draft");
        EvolutionCandidateChangeSetStatusValues.Simulated.Should().Be("Simulated");
        EvolutionCandidateChangeSetStatusValues.PendingHumanReview.Should().Be("PendingHumanReview");
        EvolutionCandidateChangeSetStatusValues.Declined.Should().Be("Declined");
        EvolutionCandidateChangeSetStatusValues.Archived.Should().Be("Archived");

        ProductLearningDispositionValues.Trusted.Should().Be("Trusted");
        ProductLearningSubjectTypeValues.Finding.Should().Be("Finding");
        ProductLearningTriageStatusValues.Open.Should().Be("Open");
        ProductLearningImprovementPlanStatusValues.Proposed.Should().Be("Proposed");
        ProductLearningImprovementThemeStatusValues.Accepted.Should().Be("Accepted");
    }

    [Fact]
    public void RuleKind_and_evaluation_type_constants_match_alert_simulation_contract()
    {
        RuleKindConstants.Simple.Should().Be("Simple");
        RuleKindConstants.Composite.Should().Be("Composite");

        EvaluationTypeConstants.Support.Should().Be("support");
        EvaluationTypeConstants.Strengthen.Should().Be("strengthen");
        EvaluationTypeConstants.Oppose.Should().Be("oppose");
        EvaluationTypeConstants.Caution.Should().Be("caution");
    }

    [Fact]
    public void DecisionReceiptConstants_and_appearance_preferences_are_stable()
    {
        DecisionReceiptConstants.SchemaVersion.Should().Contain("decision-receipt");
        DecisionReceiptConstants.CostEstimateLabel.Should().Contain("SAQ-011");

        AppearancePreferenceValues.System.Should().Be("system");
        AppearancePreferenceValues.Light.Should().Be("light");
        AppearancePreferenceValues.Dark.Should().Be("dark");
        AppearancePreferenceValues.Default.Should().Be(AppearancePreferenceValues.System);
        AppearancePreferenceValues.NormalizeOrNull(" LIGHT ").Should().Be("light");
        AppearancePreferenceValues.NormalizeOrNull("invalid").Should().BeNull();
    }

    [Fact]
    public void Citation_and_QuickScanGuardRejectionReason_roundtrip_property_bags()
    {
        Citation citation = new()
        {
            SourceId = "policy-42",
            Description = "Require private endpoints for PaaS ingress.",
        };

        citation.SourceId.Should().Be("policy-42");
        citation.Description.Should().Contain("private endpoints");

        Enum.GetValues<QuickScanGuardRejectionReason>().Should().Contain(QuickScanGuardRejectionReason.Disabled);
        Enum.GetValues<QuickScanGuardRejectionReason>().Should().Contain(QuickScanGuardRejectionReason.CaptchaRequired);
        Enum.GetValues<QuickScanGuardRejectionReason>().Length.Should().BeGreaterThan(5);
    }
}
