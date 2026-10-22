using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Findings;

/// <summary>Applies gate output to contract finding models without touching LLM-derived fields.</summary>
public static class FindingInsightDensityGateApplicator
{
    public static void ApplyToFinding(Finding finding, InsightDensityGateResult result)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(result);

        finding.InsightDensityScore = result.InsightDensityScore;
        finding.Treatment = result.Treatment;
        finding.Classification = result.Classification;
    }

    public static void ApplyToArchitectureFinding(ArchitectureFinding finding, InsightDensityGateResult result)
    {
        ArgumentNullException.ThrowIfNull(finding);
        ArgumentNullException.ThrowIfNull(result);

        finding.InsightDensityScore = result.InsightDensityScore;
        finding.Treatment = result.Treatment;
        finding.Classification = result.Classification;
    }

    public static void ApplyToFindings(IReadOnlyList<Finding> findings, IInsightDensityGate gate)
    {
        ArgumentNullException.ThrowIfNull(findings);
        ArgumentNullException.ThrowIfNull(gate);

        if (findings.Count == 0)
        {
            return;
        }

        List<InsightDensityGateCandidate> peers = findings
            .Select(InsightDensityGateCandidate.FromFinding)
            .ToList();

        for (int index = 0; index < findings.Count; index++)
        {
            InsightDensityGateResult result = gate.Score(peers[index], peers);
            ApplyToFinding(findings[index], result);
        }
    }

    public static void ApplyToArchitectureFindings(IReadOnlyList<ArchitectureFinding> findings, IInsightDensityGate gate)
    {
        ArgumentNullException.ThrowIfNull(findings);
        ArgumentNullException.ThrowIfNull(gate);

        if (findings.Count == 0)
        {
            return;
        }

        List<InsightDensityGateCandidate> peers = findings
            .Select(InsightDensityGateCandidate.FromArchitectureFinding)
            .ToList();

        for (int index = 0; index < findings.Count; index++)
        {
            InsightDensityGateResult result = gate.Score(peers[index], peers);
            ApplyToArchitectureFinding(findings[index], result);
        }
    }
}
