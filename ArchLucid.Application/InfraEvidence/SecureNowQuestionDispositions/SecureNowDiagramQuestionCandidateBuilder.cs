using ArchLucid.Core.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence.SecureNowQuestionDispositions;

/// <summary>
/// Deterministic existing production inventory-question candidate rule, shared with offline replay.
/// This does not establish complete collection or imply that an unconnected resource is defective.
/// </summary>
public static class SecureNowDiagramQuestionCandidateBuilder
{
    public static IReadOnlyList<SecureNowDiagramQuestionCandidate> Build(
        AzureInventorySnapshotDetailReadModel snapshot)
    {
        HashSet<string> resourceIds = snapshot.Resources
            .Select(resource => Normalize(resource.AzureResourceId))
            .ToHashSet(StringComparer.OrdinalIgnoreCase);
        HashSet<string> relationshipResourceIds = snapshot.Relationships
            .Where(relationship =>
            {
                string fromResourceId = Normalize(relationship.FromAzureResourceId);
                string toResourceId = Normalize(relationship.ToAzureResourceId);

                return fromResourceId.Length > 0
                       && toResourceId.Length > 0
                       && resourceIds.Contains(fromResourceId)
                       && resourceIds.Contains(toResourceId);
            })
            .SelectMany(relationship => new[]
            {
                relationship.FromAzureResourceId,
                relationship.ToAzureResourceId,
            })
            .Select(Normalize)
            .Where(value => value.Length > 0)
            .ToHashSet(StringComparer.OrdinalIgnoreCase);

        List<SecureNowDiagramQuestionCandidate> candidates = [];

        foreach (AzureInventoryResourceRecord resource in snapshot.Resources)
        {
            string resourceId = Normalize(resource.AzureResourceId);

            if (relationshipResourceIds.Contains(resourceId)
                || IsSharedServiceType(resource.ResourceType))
                continue;

            bool hasParentResourceId = !string.IsNullOrWhiteSpace(resource.ParentResourceId);
            bool parentMissingFromSnapshot = hasParentResourceId
                && !resourceIds.Contains(Normalize(resource.ParentResourceId));
            bool citedViaOffSnapshotRelationship = snapshot.Relationships.Any(relationship =>
            {
                string fromResourceId = Normalize(relationship.FromAzureResourceId);
                string toResourceId = Normalize(relationship.ToAzureResourceId);

                if (fromResourceId.Length == 0 || toResourceId.Length == 0)
                {
                    return false;
                }

                return (string.Equals(fromResourceId, resourceId, StringComparison.OrdinalIgnoreCase)
                        && !resourceIds.Contains(toResourceId))
                    || (string.Equals(toResourceId, resourceId, StringComparison.OrdinalIgnoreCase)
                        && !resourceIds.Contains(fromResourceId));
            });

            candidates.Add(new SecureNowDiagramQuestionCandidate
            {
                SubscriptionId = Normalize(resource.SubscriptionId ?? snapshot.Header.SubscriptionId),
                ResourceId = resourceId,
                ResourceType = resource.ResourceType,
                IsOrphanIntent = hasParentResourceId,
                IsUnknownEvidence = !hasParentResourceId,
                ProblemText = citedViaOffSnapshotRelationship
                    ? "Relationship endpoint is not in this inventory snapshot (off-snapshot edge)."
                    : parentMissingFromSnapshot
                    ? "Required parent is not in this inventory snapshot."
                    : string.IsNullOrWhiteSpace(resource.ParentResourceId)
                        ? "No cited connection, and this type is not on the shared-service list."
                        : "Required parent relationship is not cited.",
            });
        }

        return candidates;
    }

    private static bool IsSharedServiceType(string resourceType)
    {
        string normalized = resourceType.Trim().ToLowerInvariant();
        return normalized is "microsoft.operationalinsights/workspaces"
            or "microsoft.keyvault/vaults"
            or "microsoft.managedidentity/userassignedidentities"
            or "microsoft.insights/actiongroups"
            or "microsoft.network/privatednszones";
    }

    private static string Normalize(string? value) => value?.Trim().ToLowerInvariant() ?? string.Empty;
}
