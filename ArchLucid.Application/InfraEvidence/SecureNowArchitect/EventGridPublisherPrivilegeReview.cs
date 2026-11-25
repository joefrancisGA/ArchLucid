using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;

namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

/// <summary>Reviews observed publishing capability without inventing workload intent.</summary>
internal static class EventGridPublisherPrivilegeReview
{
    public static string? Evaluate(PrivilegePathCandidate candidate)
    {
        if (candidate.HasInsufficientEvidenceHop
            || !candidate.Hops.Any(hop => hop.EdgeType == GraphEdgeTypes.CanWrite))
            return null;

        string? role = candidate.EffectiveRoleName;
        bool sender = string.Equals(role, "EventGrid Data Sender", StringComparison.OrdinalIgnoreCase);
        bool elevated = AzureInventoryControlPlaneBuiltinRoles.IsContributorOrOwner(role)
            || string.Equals(role, "EventGrid Contributor", StringComparison.OrdinalIgnoreCase);
        if (!sender && !elevated)
            return null;

        string? type = candidate.TerminalResourceType;
        bool eventGrid = string.Equals(type, "Microsoft.EventGrid/topics", StringComparison.OrdinalIgnoreCase)
            || string.Equals(type, "Microsoft.EventGrid/domains", StringComparison.OrdinalIgnoreCase);
        if (!eventGrid && !sender)
            return null;

        PrivilegePathEdge? assignment = candidate.Hops.LastOrDefault(hop => hop.EdgeType == GraphEdgeTypes.HasRole);
        if (assignment is null || assignment.ProvenanceKind != ProvenanceKind.ObservedFact)
            return null;

        if (elevated)
            return "management-role-publisher-review";

        string scope = ArmResourceIdNormalizer.Normalize(assignment.ToNodeId);
        string[] segments = scope.Split('/', StringSplitOptions.RemoveEmptyEntries);
        bool broad = scope == "/" ||
            (segments.Length == 2 && segments[0].Equals("subscriptions", StringComparison.OrdinalIgnoreCase)) ||
            (segments.Length == 4 && segments[0].Equals("subscriptions", StringComparison.OrdinalIgnoreCase)
                && segments[2].Equals("resourceGroups", StringComparison.OrdinalIgnoreCase)) ||
            (segments.Length == 4 && segments[0].Equals("providers", StringComparison.OrdinalIgnoreCase)
                && segments[1].Equals("Microsoft.Management", StringComparison.OrdinalIgnoreCase)
                && segments[2].Equals("managementGroups", StringComparison.OrdinalIgnoreCase));

        return broad ? "broad-publisher-scope-review" : "publisher-intent-unverified";
    }

    public static string Describe(string review) => review switch
    {
        "management-role-publisher-review" =>
            "Publishing capability is associated with a broader management role. If publishing is the intended workload duty, evaluate replacing it with EventGrid Data Sender at the required resource scope. Management duties and actual use are unverified.",
        "broad-publisher-scope-review" =>
            "The EventGrid Data Sender assignment has an ancestor scope. Review whether publishing to every applicable descendant is required; narrow to required topics or domains if appropriate. Intended scope and actual use are unverified.",
        _ =>
            "Publisher capability is observed, but the intended publishing scope and actual use are unverified. No least-privilege violation is established.",
    };
}
