using ArchLucid.Contracts.Agents;
using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Core")]
public sealed class AgentArchitectureFindingProvenanceValidatorTests
{
    [Fact]
    public void HasKindBProvenance_exempts_checklist_coverage()
    {
        ArchitectureFinding finding = new()
        {
            Classification = FindingClassification.ChecklistCoverage,
            Message = "Tagging hygiene gap",
        };

        AgentArchitectureFindingProvenanceValidator.HasKindBProvenance(finding).Should().BeTrue();
    }

    [Fact]
    public void HasKindBProvenance_exempts_low_confidence_heuristic_rows()
    {
        ArchitectureFinding finding = new()
        {
            Classification = FindingClassification.DecisionGradeFinding,
            ConfidenceLevel = FindingConfidenceLevel.Low,
            Message = "Heuristic concern",
        };

        AgentArchitectureFindingProvenanceValidator.HasKindBProvenance(finding).Should().BeTrue();
    }

    [Fact]
    public void HasKindBProvenance_exempts_density_demoted_rows()
    {
        ArchitectureFinding finding = new()
        {
            Classification = FindingClassification.DecisionGradeFinding,
            Treatment = FindingTreatment.DemoteToChecklist,
            Message = "Demoted concern",
        };

        AgentArchitectureFindingProvenanceValidator.HasKindBProvenance(finding).Should().BeTrue();
    }

    [Fact]
    public void HasKindBProvenance_rejects_empty_evidence_refs()
    {
        ArchitectureFinding finding = new()
        {
            Classification = FindingClassification.DecisionGradeFinding,
            Message = "Unreferenced compliance concern",
        };

        AgentArchitectureFindingProvenanceValidator.HasKindBProvenance(finding).Should().BeFalse();
    }

    [Fact]
    public void HasKindBProvenance_rejects_non_resolvable_evidence_refs()
    {
        ArchitectureFinding finding = new()
        {
            Classification = FindingClassification.DecisionGradeFinding,
            Message = "Opaque evidence ref",
            EvidenceRefs = ["evidence:control-1"],
        };

        AgentArchitectureFindingProvenanceValidator.HasKindBProvenance(finding).Should().BeFalse();
    }

    [Fact]
    public void HasKindBProvenance_allows_resolvable_doc_ref()
    {
        ArchitectureFinding finding = new()
        {
            Classification = FindingClassification.DecisionGradeFinding,
            Message = "Cited concern",
            EvidenceRefs = ["doc:manifest.json#services"],
        };

        AgentArchitectureFindingProvenanceValidator.HasKindBProvenance(finding).Should().BeTrue();
    }

    [Fact]
    public void HasKindBProvenance_allows_policy_rule_id_without_evidence_refs()
    {
        ArchitectureFinding finding = new()
        {
            Classification = FindingClassification.DecisionGradeFinding,
            Message = "Pack rule",
            PolicyRuleId = "cis-1.2.3",
        };

        AgentArchitectureFindingProvenanceValidator.HasKindBProvenance(finding).Should().BeTrue();
    }

    [Fact]
    public void HasKindBProvenance_allows_policy_rule_evidence_ref()
    {
        ArchitectureFinding finding = new()
        {
            Classification = FindingClassification.DecisionGradeFinding,
            Message = "Pack rule ref",
            EvidenceRefs = ["policy-rule:cis-1.2.3"],
        };

        AgentArchitectureFindingProvenanceValidator.HasKindBProvenance(finding).Should().BeTrue();
    }
}
