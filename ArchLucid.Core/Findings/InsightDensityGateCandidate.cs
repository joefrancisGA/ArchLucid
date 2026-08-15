using ArchLucid.Contracts.Findings;

namespace ArchLucid.Core.Findings;

/// <summary>Normalized candidate passed to <see cref="IInsightDensityGate" />.</summary>
public sealed class InsightDensityGateCandidate
{
    public InsightDensityGateCandidate(
        string candidateKey,
        string message,
        IReadOnlyList<string> evidenceRefs,
        FindingSeverity severity,
        string category = "",
        bool isAgentArchitectureFinding = false)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(candidateKey);
        ArgumentNullException.ThrowIfNull(message);
        ArgumentNullException.ThrowIfNull(evidenceRefs);

        CandidateKey = candidateKey;
        Message = message;
        EvidenceRefs = evidenceRefs;
        Severity = severity;
        Category = category ?? string.Empty;
        IsAgentArchitectureFinding = isAgentArchitectureFinding;
    }

    public string CandidateKey
    {
        get;
    }

    public string Message
    {
        get;
    }

    public IReadOnlyList<string> EvidenceRefs
    {
        get;
    }

    public FindingSeverity Severity
    {
        get;
    }

    public string Category
    {
        get;
    }

    /// <summary>True when the finding originated from an LLM agent architecture payload (demotion-eligible).</summary>
    public bool IsAgentArchitectureFinding
    {
        get;
    }

    public static InsightDensityGateCandidate FromFinding(Finding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        string message = string.IsNullOrWhiteSpace(finding.Rationale) ? finding.Title : finding.Rationale;

        return new InsightDensityGateCandidate(
            finding.FindingId,
            message,
            ExtractEvidenceRefs(finding),
            finding.Severity,
            finding.Category,
            InsightDensityFindingSourceClassifier.IsAgentArchitectureFinding(finding.FindingType));
    }

    public static InsightDensityGateCandidate FromArchitectureFinding(ArchitectureFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        return new InsightDensityGateCandidate(
            finding.FindingId,
            finding.Message,
            finding.EvidenceRefs,
            finding.Severity,
            finding.Category,
            isAgentArchitectureFinding: true);
    }

    internal static List<string> ExtractEvidenceRefs(Finding finding)
    {
        List<string> evidenceRefs = finding.Trace.Notes
            .Where(static note => note.StartsWith("evidence:", StringComparison.OrdinalIgnoreCase))
            .Select(static note => note["evidence:".Length..])
            .ToList();

        if (evidenceRefs.Count == 0 && finding.RelatedNodeIds.Count > 0)
        {
            evidenceRefs.AddRange(finding.RelatedNodeIds);
        }

        return evidenceRefs;
    }
}
