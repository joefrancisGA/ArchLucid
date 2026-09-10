using ArchLucid.Contracts.Findings;
using ArchLucid.Core.Findings;
using ArchLucid.Decisioning.Configuration;
using ArchLucid.Decisioning.Findings;
using ArchLucid.Decisioning.Services;
using ArchLucid.Decisioning.Services.Findings;
using ArchLucid.KnowledgeGraph.Models;

using FluentAssertions;

using Microsoft.Extensions.Options;

namespace ArchLucid.Decisioning.Tests.Findings;

/// <summary>
///     AS-073 livelihood exhibit — cited ARM excerpt present but finding claim contradicts it.
///     Cited by AS-100 wave close audit.
/// </summary>
[Trait("Category", "Unit")]
[Trait("Suite", "Decisioning")]
public sealed class ArchitectureSpineAs073HeuristicMismatchArchitectureTests
{
    private const string NsgArmId =
        "/subscriptions/00000000-0000-4000-8000-000000000001/resourceGroups/rg/providers/Microsoft.Network/networkSecurityGroups/edge-nsg";

    private const string ArmExcerptFromTemplate =
        "Kubernetes ingress controller exposes the storefront workload on port 443.";

    private const string OppositeClaim =
        "PostgreSQL firewall rules allow unrestricted storage account access from the public internet.";

    [Fact]
    public async Task As073_merge_gate_scores_arm_excerpt_mismatch_as_unsupported_without_checklist_demotion()
    {
        string armEvidenceRef = $"{NsgArmId} — {ArmExcerptFromTemplate}";

        Finding finding = new()
        {
            FindingId = "f-as073-mismatch",
            FindingType = "IdentityBlastRadiusFinding",
            Category = "Security",
            EngineType = "identity-blast-radius",
            Title = "Database firewall allows unrestricted public storage access",
            Rationale = OppositeClaim,
            Severity = FindingSeverity.Error,
            Classification = FindingClassification.DecisionGradeFinding,
            Treatment = FindingTreatment.Promote,
            RelatedNodeIds = ["sql-pay-prod"],
            EvidenceRefs = [armEvidenceRef],
            Trace = new ExplainabilityTrace
            {
                RulesApplied = ["identity-blast-radius"],
                Notes = ["evidence:graph-node:sql-pay-prod"],
            },
        };

        FindingsStageContext context = new()
        {
            RunId = Guid.NewGuid(),
            ContextSnapshotId = Guid.NewGuid(),
            GraphSnapshot = new GraphSnapshot { GraphSnapshotId = Guid.NewGuid() },
        };
        context.AllFindings.Add(finding);
        context.SuccessfulEngineInvocations = 1;
        context.SuccessfulEngineTypes.Add("identity-blast-radius");

        FindingsMergeAndGateStage stage = new(
            Options.Create(new HumanReviewFindingOptions()),
            Options.Create(new InsightDensityGateOptions()),
            new FindingProvenanceValidator());

        await stage.ExecuteAsync(context, CancellationToken.None);

        Finding emitted = context.Snapshot!.Findings.Should().ContainSingle().Subject;

        emitted.FindingId.Should().Be("f-as073-mismatch");
        emitted.Classification.Should().Be(FindingClassification.DecisionGradeFinding);
        emitted.Treatment.Should().NotBe(FindingTreatment.DemoteToChecklist);
        emitted.SemanticSupportBand.Should().Be(FindingSemanticSupportBand.Unsupported);
        emitted.EvidenceRefs.Should().Contain(armEvidenceRef);
    }

    [Fact]
    public void As073_scorer_arm_excerpt_mismatch_returns_unsupported_for_disjoint_claim()
    {
        string armEvidenceRef = $"{NsgArmId} — {ArmExcerptFromTemplate}";

        FindingSemanticSupportBand band = FindingSemanticSupportBandScorer.Score(
            OppositeClaim,
            [armEvidenceRef]);

        band.Should().Be(FindingSemanticSupportBand.Unsupported);
    }

    [Fact]
    public void As073_emission_applicator_stamps_unsupported_without_removing_finding()
    {
        string armEvidenceRef = $"{NsgArmId} — {ArmExcerptFromTemplate}";

        Finding finding = new()
        {
            FindingId = "f-as073-emission",
            FindingType = "IdentityBlastRadiusFinding",
            Category = "Security",
            EngineType = "identity-blast-radius",
            Title = "Database firewall allows unrestricted public storage access",
            Rationale = OppositeClaim,
            Classification = FindingClassification.DecisionGradeFinding,
            Treatment = FindingTreatment.Promote,
            RelatedNodeIds = ["sql-pay-prod"],
            EvidenceRefs = [armEvidenceRef],
            Trace = new ExplainabilityTrace
            {
                RulesApplied = ["identity-blast-radius"],
                Notes = ["evidence:graph-node:sql-pay-prod"],
            },
        };

        FindingProvenanceEmissionApplicator.Apply([finding], new FindingProvenanceValidator());
        FindingSemanticSupportBandDefaultsApplicator.Apply([finding]);
        FindingSemanticSupportBandEmissionApplicator.Apply([finding]);

        finding.Classification.Should().Be(FindingClassification.DecisionGradeFinding);
        finding.Treatment.Should().NotBe(FindingTreatment.DemoteToChecklist);
        finding.SemanticSupportBand.Should().Be(FindingSemanticSupportBand.Unsupported);
    }
}
