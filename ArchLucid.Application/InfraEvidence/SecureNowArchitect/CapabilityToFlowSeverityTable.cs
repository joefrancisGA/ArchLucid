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
                Severity = "Medium",
                BusinessCriticality = "Unknown",
                BlastRadius = "PossibleMovement",
            };
        }

        if (candidate.Hops.Any(static hop => hop.EdgeType == GraphEdgeTypes.CanWrite))
        {
            return new PrivilegePathSeverityResult
            {
                Severity = "High",
                BusinessCriticality = "Unknown",
                BlastRadius = "PossibleMovement",
            };
        }

        return new PrivilegePathSeverityResult
        {
            Severity = "Medium",
            BusinessCriticality = "Unknown",
            BlastRadius = "PossibleMovement",
        };
    }
}
