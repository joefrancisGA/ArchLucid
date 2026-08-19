using ArchLucid.Contracts.ArchitectureIntelligence;

namespace ArchLucid.Application.ArchitectureIntelligence;

/// <summary>
/// Collapses claim-origin × support-status into operator-facing buckets (TB-1984).
/// </summary>
public static class ProvenancePresentationMapper
{
    public static ProvenancePresentationBucket Map(ClaimProvenance provenance)
    {
        ArgumentNullException.ThrowIfNull(provenance);

        if (provenance.SupportStatus == SupportStatus.DirectlyEstablished
            && provenance.Origin is ClaimOrigin.DirectlyExtracted
                or ClaimOrigin.ExternallySourced
                or ClaimOrigin.UserAsserted
                or ClaimOrigin.HumanApproved)
        {
            return ProvenancePresentationBucket.SourceBacked;
        }

        if (provenance.SupportStatus is SupportStatus.Unsupported
                or SupportStatus.NotYetEvaluated
            || provenance.Origin == ClaimOrigin.ExternallySourced
                && provenance.SupportStatus != SupportStatus.DirectlyEstablished)
        {
            return ProvenancePresentationBucket.Unverified;
        }

        if (provenance.SupportStatus is SupportStatus.Contradicted or SupportStatus.Conflicting)
        {
            return ProvenancePresentationBucket.Inferred;
        }

        if (provenance.Origin == ClaimOrigin.SystemProposed)
        {
            return ProvenancePresentationBucket.Hypothesis;
        }

        return ProvenancePresentationBucket.Inferred;
    }

    public static ProvenancePresentationBucket MapFinding(SpecialistReviewFinding finding)
    {
        ArgumentNullException.ThrowIfNull(finding);

        if (finding.EvidenceCondition is EvidenceCondition.Insufficient or EvidenceCondition.Unverified)
        {
            return ProvenancePresentationBucket.Unverified;
        }

        if (finding.Conclusion == ReviewConclusion.Indeterminate)
        {
            return ProvenancePresentationBucket.Unverified;
        }

        return Map(finding.Provenance);
    }
}
