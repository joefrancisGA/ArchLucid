using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

/// <summary>Reader-facing hop edge labels for SecureNow path narratives (no raw graph tokens).</summary>
internal static class SecurityEvidencePathHopRelationshipLabel
{
    public static string Format(string? edgeType)
    {
        if (string.IsNullOrWhiteSpace(edgeType))
        {
            return "Relationship type was not stored";
        }

        string normalized = edgeType.Trim();

        if (normalized.Equals(GraphEdgeTypes.CanRead, StringComparison.OrdinalIgnoreCase))
        {
            return "Role allows read. This is not observed use.";
        }

        if (normalized.Equals(GraphEdgeTypes.CanWrite, StringComparison.OrdinalIgnoreCase))
        {
            return "Role allows write. This is not observed use.";
        }

        if (normalized.Equals(GraphEdgeTypes.UsesIdentity, StringComparison.OrdinalIgnoreCase))
        {
            return "Identity is assigned. Use of that identity was not stored.";
        }

        if (normalized.Equals(GraphEdgeTypes.MemberOf, StringComparison.OrdinalIgnoreCase))
        {
            return "Group membership was stored. Observed use of that membership was not stored.";
        }

        if (normalized.Equals(SecureNowArchitectConstants.PossibleMovementHopEdgeType, StringComparison.OrdinalIgnoreCase))
        {
            return "Possible movement. An observed move was not stored.";
        }

        if (normalized.Equals(SecureNowArchitectConstants.UnrestrictedEgressHopEdgeType, StringComparison.OrdinalIgnoreCase))
        {
            return "unrestricted egress (declared NSG allow)";
        }

        if (normalized.Equals(SecureNowArchitectConstants.InsufficientEvidenceEgressHopEdgeType, StringComparison.OrdinalIgnoreCase))
        {
            return "egress not fully verified";
        }

        if (normalized.Equals(SecureNowArchitectConstants.SharedControlFanOutHopEdgeType, StringComparison.OrdinalIgnoreCase))
        {
            return "shared control fan-out";
        }

        if (normalized.Equals(SecureNowArchitectConstants.PublicNetworkAccessHopEdgeType, StringComparison.OrdinalIgnoreCase))
        {
            return "public network exposure";
        }

        return normalized;
    }

    public static string FormatHopSegment(string fromLabel, string edgeType, string toLabel) =>
        $"{fromLabel} — {Format(edgeType)} — {toLabel}";
}
