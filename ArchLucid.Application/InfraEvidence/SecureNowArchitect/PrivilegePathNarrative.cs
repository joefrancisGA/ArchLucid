using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class PrivilegePathNarrative
{
    public static string BuildTitle(PrivilegePathCandidate candidate)
    {
        string action = candidate.HasInsufficientEvidenceHop
            ? "unknown role actions"
            : ResolveActionLabel(candidate);
        string scope = ShortNodeLabel(candidate.TerminalScopeNodeId);

        if (candidate.IsFederatedDeploymentPath)
        {
            return $"Federated deployment identity → {action} → {scope}";
        }

        if (candidate.IsGroupNestedPath)
        {
            return $"Group-nested privilege path → {action} → {scope}";
        }

        string start = ShortNodeLabel(candidate.Hops[0].FromNodeId);

        return $"Privilege path: {start} → {action} → {scope}";
    }

    public static string BuildDescription(PrivilegePathCandidate candidate)
    {
        IEnumerable<string> hopDescriptions = candidate.Hops.Select(static hop =>
            $"{ShortNodeLabel(hop.FromNodeId)} -[{hop.EdgeType}]-> {ShortNodeLabel(hop.ToNodeId)}");

        string pathSummary = string.Join("; ", hopDescriptions);

        if (candidate.IsFederatedDeploymentPath)
        {
            return
                $"Federated CI identity may assume deployment privileges via Entra federated credential. {pathSummary}.";
        }

        if (candidate.IsGroupNestedPath)
        {
            return $"Transitive privilege path via Entra group membership. {pathSummary}.";
        }

        if (candidate.Hops.Any(static hop => hop.EdgeType == GraphEdgeTypes.UsesIdentity))
        {
            return $"Transitive privilege path via managed identity. {pathSummary}.";
        }

        return $"Transitive privilege path. {pathSummary}.";
    }

    private static string ResolveActionLabel(PrivilegePathCandidate candidate)
    {
        PrivilegePathEdge? actionHop = candidate.Hops.LastOrDefault(static hop =>
            hop.EdgeType is GraphEdgeTypes.CanRead or GraphEdgeTypes.CanWrite);

        if (actionHop is not null)
        {
            string roleSuffix = string.IsNullOrWhiteSpace(candidate.EffectiveRoleName)
                ? string.Empty
                : $" ({candidate.EffectiveRoleName})";

            return actionHop.EdgeType == GraphEdgeTypes.CanWrite
                ? $"write access{roleSuffix}"
                : $"read access{roleSuffix}";
        }

        return candidate.EffectiveRoleName ?? "privileged access";
    }

    private static string ShortNodeLabel(string nodeId)
    {
        if (nodeId.StartsWith(AzureInventoryFederatedCredentialNodeId.Prefix, StringComparison.Ordinal))
        {
            return "federated deployment identity";
        }

        if (nodeId.StartsWith(AzureInventoryPrincipalNodeId.Prefix, StringComparison.Ordinal))
        {
            return $"principal:{nodeId[^8..]}";
        }

        int lastSlash = nodeId.LastIndexOf('/');

        return lastSlash >= 0 ? nodeId[(lastSlash + 1)..] : nodeId;
    }
}
