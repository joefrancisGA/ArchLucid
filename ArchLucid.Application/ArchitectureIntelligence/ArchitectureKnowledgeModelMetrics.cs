using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

public static class ArchitectureKnowledgeModelMetrics
{
    public const string CriticalUnsupportedAssumptions = "CriticalUnsupportedAssumptions";
    public const string RequirementsWithDesignCoverage = "RequirementsWithDesignCoverage";
    public const string HighSeverityFindings = "HighSeverityFindings";
    public const string EvidenceBackedDecisions = "EvidenceBackedDecisions";

    public static Dictionary<string, int> CountMetrics(
        ArchitectureKnowledgeModel model,
        IReadOnlyList<SpecialistReviewFinding> findings)
    {
        int criticalUnsupportedAssumptions = model.Elements.Count(element =>
            element.Kind == ArchitectureElementKind.Assumption
            && element.Provenance.SupportStatus is SupportStatus.Unsupported or SupportStatus.NotYetEvaluated
            && element.ExtractionConfidence < 0.5);

        int requirements = model.Elements.Count(
            element => element.Kind == ArchitectureElementKind.FunctionalRequirement);

        int components = model.Elements.Count(
            element => element.Kind == ArchitectureElementKind.Component);

        int requirementsWithDesignCoverage = requirements == 0
            ? 0
            : Math.Min(requirements, components);

        int highSeverityFindings = findings.Count(
            finding => finding.Severity.Equals("High", StringComparison.OrdinalIgnoreCase)
                || finding.Severity.Equals("Critical", StringComparison.OrdinalIgnoreCase));

        int evidenceBackedDecisions = model.Elements.Count(element =>
            element.Kind == ArchitectureElementKind.Decision
            && element.Provenance.SupportStatus == SupportStatus.DirectlyEstablished
            && !string.IsNullOrWhiteSpace(element.Provenance.SourceArtifactId));

        return new Dictionary<string, int>
        {
            [CriticalUnsupportedAssumptions] = criticalUnsupportedAssumptions,
            [RequirementsWithDesignCoverage] = requirementsWithDesignCoverage,
            [HighSeverityFindings] = highSeverityFindings,
            [EvidenceBackedDecisions] = evidenceBackedDecisions,
        };
    }
}
