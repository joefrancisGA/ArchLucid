using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

/// <summary>
///     AS-073 livelihood exhibit: cited ARM excerpt present but finding message asserts the opposite —
///     band is Unsupported while structural Kind B provenance keeps the row decision-grade (ADR 0082).
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Decisioning")]
public sealed class FindingSemanticSupportBandScorerAs073LivelihoodExhibitTests
{
    private const string ArmExcerpt =
        "graph-node:sql-primary — storage account encryption enabled with customer-managed keys for backup retention.";

    [Fact]
    public void As073_arm_citation_with_opposite_message_scores_unsupported_not_demoted()
    {
        const string findingMessage =
            "Anonymous internet callers can reach the payment API without authentication or network segmentation controls.";

        FindingSemanticSupportBand band = FindingSemanticSupportBandScorer.Score(
            findingMessage,
            [ArmExcerpt]);

        band.Should().Be(FindingSemanticSupportBand.Unsupported);
    }

    [Fact]
    public void As073_emission_applicator_keeps_decision_grade_with_unsupported_band()
    {
        Finding finding = new()
        {
            Classification = FindingClassification.DecisionGradeFinding,
            Title = "Public SQL exposure",
            Rationale =
                "Anonymous internet callers can reach the payment API without authentication or network segmentation controls.",
            EvidenceRefs = [ArmExcerpt],
        };

        FindingSemanticSupportBandDefaultsApplicator.Apply([finding]);
        FindingSemanticSupportBandEmissionApplicator.Apply([finding]);

        finding.Classification.Should().Be(FindingClassification.DecisionGradeFinding);
        finding.EvidenceRefs.Should().NotBeEmpty("Kind B structural citation remains on the row (ADR 0082)");
        finding.SemanticSupportBand.Should().Be(FindingSemanticSupportBand.Unsupported);
    }
}
