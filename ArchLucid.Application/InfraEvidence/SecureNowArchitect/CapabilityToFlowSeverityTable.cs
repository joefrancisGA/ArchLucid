using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class CapabilityToFlowSeverityTable
{
    public static PrivilegePathSeverityResult Resolve(CapabilityToFlowCandidate candidate)
    {
        if (candidate.HasInsufficientEvidenceHop)
        {
            return new PrivilegePathSeverityResult
            {
                Severity = string.Empty,
                BusinessCriticality = FourRealityDriftNarrative.BusinessCriticalityNotStoredLabel,
                BlastRadius = FourRealityDriftNarrative.BlastRadiusNotMeasuredLabel,
            };
        }

        if (candidate.Hops.Any(static hop => hop.EdgeType == GraphEdgeTypes.CanWrite))
        {
        return new PrivilegePathSeverityResult
        {
            Severity = "High",
            BusinessCriticality = FourRealityDriftNarrative.BusinessCriticalityNotStoredLabel,
            BlastRadius = FourRealityDriftNarrative.BlastRadiusNotMeasuredLabel,
        };
    }

    return new PrivilegePathSeverityResult
    {
        Severity = string.Empty,
        BusinessCriticality = FourRealityDriftNarrative.BusinessCriticalityNotStoredLabel,
        BlastRadius = FourRealityDriftNarrative.BlastRadiusNotMeasuredLabel,
    };
    }
}
