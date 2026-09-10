using ArchLucid.Contracts.Findings;
using ArchLucid.Decisioning.Findings;

using FluentAssertions;

namespace ArchLucid.Decisioning.Tests.Findings;

[Trait("Category", "Unit")]
[Trait("Suite", "Decisioning")]
public sealed class FindingSemanticSupportBandEmissionApplicatorTests
{
    [Fact]
    public void Apply_exact_quote_overlap_sets_supported_for_decision_grade()
    {
        const string citation =
            "The API gateway terminates TLS and forwards traffic to the internal router service.";

        Finding finding = new()
        {
            Classification = FindingClassification.DecisionGradeFinding,
            Title = "Gateway posture",
            Rationale = citation,
            EvidenceRefs = [citation],
        };

        FindingSemanticSupportBandDefaultsApplicator.Apply([finding]);
        FindingSemanticSupportBandEmissionApplicator.Apply([finding]);

        finding.SemanticSupportBand.Should().Be(FindingSemanticSupportBand.Supported);
    }

    [Fact]
    public void Apply_disjoint_citation_sets_unsupported_for_decision_grade()
    {
        const string citation =
            "Kubernetes ingress controller exposes the storefront workload on port 443.";

        Finding finding = new()
        {
            Classification = FindingClassification.DecisionGradeFinding,
            Title = "Storage exposure",
            Rationale =
                "PostgreSQL firewall rules allow unrestricted storage account access from the public internet.",
            EvidenceRefs = [citation],
        };

        FindingSemanticSupportBandDefaultsApplicator.Apply([finding]);
        FindingSemanticSupportBandEmissionApplicator.Apply([finding]);

        finding.SemanticSupportBand.Should().Be(FindingSemanticSupportBand.Unsupported);
    }

    [Fact]
    public void Apply_empty_evidence_refs_leaves_unchecked_default()
    {
        Finding finding = new()
        {
            Classification = FindingClassification.DecisionGradeFinding,
            Title = "Firewall allows public ingress on database subnet.",
            Rationale = "Firewall allows public ingress on database subnet.",
            EvidenceRefs = [],
        };

        FindingSemanticSupportBandDefaultsApplicator.Apply([finding]);
        FindingSemanticSupportBandEmissionApplicator.Apply([finding]);

        finding.SemanticSupportBand.Should().Be(FindingSemanticSupportBand.Unchecked);
    }

    [Fact]
    public void Apply_checklist_coverage_stays_not_scored()
    {
        Finding finding = new()
        {
            Classification = FindingClassification.ChecklistCoverage,
            Title = "Checklist row",
            Rationale = "Checklist row",
            EvidenceRefs =
            [
                "The API gateway terminates TLS and forwards traffic to the internal router service.",
            ],
        };

        FindingSemanticSupportBandDefaultsApplicator.Apply([finding]);
        FindingSemanticSupportBandEmissionApplicator.Apply([finding]);

        finding.SemanticSupportBand.Should().Be(FindingSemanticSupportBand.NotScored);
    }
}
