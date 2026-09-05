using ArchLucid.Contracts.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.Ask;

internal static class InfraEvidenceAskIntentResolver
{
    public static string Resolve(InfraEvidenceAskRequest request)
    {
        ArgumentNullException.ThrowIfNull(request);

        string question = request.Question.Trim();

        if (request.AssessmentId.HasValue
            && request.AuditEvidenceSnapshotId.HasValue
            && request.ControlId.HasValue
            && ContainsAny(question, "control", "audit", "evidenced", "lineage", "why is this"))
        {
            return InfraEvidenceAskTopicKinds.AuditControlEvidence;
        }

        if (ContainsAny(question, "diagram", "not in diagram", "infrastructure only", "diagram gap", "missing from diagram"))
            return InfraEvidenceAskTopicKinds.DiagramGap;

        if (ContainsAny(question, "pattern", "remediation coverage", "exact match", "recurred"))
            return InfraEvidenceAskTopicKinds.PatternCoverage;

        if (ContainsAny(question, "as of", "captured", "snapshot date", "architecture as of"))
            return InfraEvidenceAskTopicKinds.ArchitectureAsOfDate;

        if (request.DiffId.HasValue || ContainsAny(question, "drift", "diff", "changed since", "subscription change"))
            return InfraEvidenceAskTopicKinds.Drift;

        if (request.SinceUtc.HasValue || ContainsAny(question, "since", "after", "subscription change"))
            return InfraEvidenceAskTopicKinds.SubscriptionChange;

        return InfraEvidenceAskTopicKinds.ResourceOverview;
    }

    private static bool ContainsAny(string question, params string[] needles)
    {
        foreach (string needle in needles)
        {
            if (question.Contains(needle, StringComparison.OrdinalIgnoreCase))
                return true;
        }

        return false;
    }
}
