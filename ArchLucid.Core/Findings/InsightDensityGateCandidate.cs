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
        bool isAgentArchitectureFinding = false,
        string engineType = "",
        IReadOnlyList<string>? relatedNodeIds = null,
        int? impactHopCount = null)
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
        EngineType = string.IsNullOrWhiteSpace(engineType) ? string.Empty : engineType.Trim();
        RelatedNodeIds = NormalizeRelatedNodeIds(relatedNodeIds);
        ImpactHopCount = impactHopCount is > 0 ? impactHopCount : null;
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

    /// <summary>Typed engine identifier when the finding originated from a built-in engine (empty for agent rows).</summary>
    public string EngineType
    {
        get;
    }

    /// <summary>Graph node ids cited by the finding (never null).</summary>
    public IReadOnlyList<string> RelatedNodeIds
    {
        get;
    }

    /// <summary>Path length when the typed engine already computed hop count (null when unknown).</summary>
    public int? ImpactHopCount
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
            InsightDensityFindingSourceClassifier.IsAgentArchitectureFinding(finding.FindingType),
            finding.EngineType,
            finding.RelatedNodeIds,
            InsightDensityGateCandidateImpactHopCountResolver.TryResolveImpactHopCount(finding));
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
            isAgentArchitectureFinding: true,
            engineType: string.Empty,
            relatedNodeIds: []);
    }

    internal static IReadOnlyList<string> NormalizeRelatedNodeIds(IReadOnlyList<string>? relatedNodeIds)
    {
        if (relatedNodeIds is null || relatedNodeIds.Count == 0)
        {
            return [];
        }

        List<string> normalized = [];

        foreach (string nodeId in relatedNodeIds)
        {
            if (string.IsNullOrWhiteSpace(nodeId))
            {
                continue;
            }

            string trimmed = nodeId.Trim();

            if (normalized.Any(existing => existing.Equals(trimmed, StringComparison.OrdinalIgnoreCase)))
            {
                continue;
            }

            normalized.Add(trimmed);
        }

        return normalized;
    }

    internal static List<string> ExtractEvidenceRefs(Finding finding)
    {
        List<string> evidenceRefs = [];

        foreach (string reference in finding.EvidenceRefs)
        {
            if (string.IsNullOrWhiteSpace(reference))
                continue;

            string trimmed = reference.Trim();

            if (evidenceRefs.Any(existing => existing.Equals(trimmed, StringComparison.OrdinalIgnoreCase)))
                continue;

            evidenceRefs.Add(trimmed);
        }

        foreach (string note in finding.Trace.Notes)
        {
            if (!note.StartsWith("evidence:", StringComparison.OrdinalIgnoreCase))
                continue;

            string trimmed = note["evidence:".Length..].Trim();

            if (string.IsNullOrWhiteSpace(trimmed))
                continue;

            if (evidenceRefs.Any(existing => existing.Equals(trimmed, StringComparison.OrdinalIgnoreCase)))
                continue;

            evidenceRefs.Add(trimmed);
        }

        if (!string.IsNullOrWhiteSpace(finding.PolicyRuleId))
        {
            string policyRuleRef = $"policy-rule:{finding.PolicyRuleId.Trim()}";

            if (!evidenceRefs.Any(existing => existing.Equals(policyRuleRef, StringComparison.OrdinalIgnoreCase)))
                evidenceRefs.Add(policyRuleRef);
        }

        return evidenceRefs;
    }
}
