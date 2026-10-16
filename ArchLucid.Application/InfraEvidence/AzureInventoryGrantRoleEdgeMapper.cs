using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>
///     Emits CAN_GRANT_ROLE hops for Graph role grants and Global Administrator elevation (book Ch. 4 §4.4).
/// </summary>
public static class AzureInventoryGrantRoleEdgeMapper
{
    private const decimal DerivedFactConfidence = 0.9m;

    public static void MapGrantRole(
        IReadOnlyList<AzureExtractorExtendedResourceRow> resources,
        IReadOnlyList<AzureInventoryDirectoryRoleAssignmentRow> directoryRoleAssignments,
        IReadOnlyList<AzureInventoryEntraApplicationRegistrationRow> applicationRegistrations,
        IReadOnlyList<AzureInventoryGraphAppRoleAssignmentRow> graphAppRoleAssignments,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys)
    {
        ArgumentNullException.ThrowIfNull(resources);
        ArgumentNullException.ThrowIfNull(directoryRoleAssignments);
        ArgumentNullException.ThrowIfNull(applicationRegistrations);
        ArgumentNullException.ThrowIfNull(graphAppRoleAssignments);
        ArgumentNullException.ThrowIfNull(relationships);
        ArgumentNullException.ThrowIfNull(relationshipKeys);

        List<string> servicePrincipalNodeIds = BuildDistinctServicePrincipalNodeIds(applicationRegistrations);
        List<string> subscriptionScopes = BuildDistinctSubscriptionScopes(resources);
        HashSet<string> applicationReadWriteAllPrincipalNodeIds =
            BuildApplicationReadWriteAllPrincipalNodeIds(graphAppRoleAssignments);

        foreach (AzureInventoryDirectoryRoleAssignmentRow assignment in directoryRoleAssignments)
        {
            if (IsPimEligibilityUnknown(assignment.PimEligibilityKind))
            {
                continue;
            }

            string? templateId = ResolveRoleTemplateId(assignment);

            if (string.IsNullOrWhiteSpace(templateId)
                || !templateId.Equals(
                    AzureInventoryAddCredentialDirectoryRoleTemplates.GlobalAdministrator,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            if (!AzureInventoryAddCredentialDirectoryRoleTemplates.IsTenantWideDirectoryScope(assignment.DirectoryScopeId))
            {
                continue;
            }

            EmitElevationHops(
                relationships,
                relationshipKeys,
                assignment.PrincipalNodeId,
                subscriptionScopes);
        }

        foreach (AzureInventoryGraphAppRoleAssignmentRow assignment in graphAppRoleAssignments)
        {
            if (assignment.AppRoleId.Equals(
                    AzureInventoryMicrosoftGraphWellKnown.RoleManagementReadWriteDirectoryAppRoleId,
                    StringComparison.OrdinalIgnoreCase))
            {
                EmitGrantRoleToApplications(
                    relationships,
                    relationshipKeys,
                    assignment.PrincipalNodeId,
                    servicePrincipalNodeIds,
                    AzureInventoryGrantRoleInferenceQualifiers.GraphRoleManagementReadWriteDirectory);

                EmitElevationHops(
                    relationships,
                    relationshipKeys,
                    assignment.PrincipalNodeId,
                    subscriptionScopes);

                continue;
            }

            if (!assignment.AppRoleId.Equals(
                    AzureInventoryMicrosoftGraphWellKnown.AppRoleAssignmentReadWriteAllAppRoleId,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            string selfGrantNodeId = AzureInventoryGraphAppRoleSelfGrantNodeId.Format(assignment.PrincipalId);

            AddGrantRoleEdge(
                relationships,
                relationshipKeys,
                assignment.PrincipalNodeId,
                selfGrantNodeId,
                AzureInventoryGrantRoleInferenceQualifiers.GraphAppRoleAssignmentReadWriteAll);

            EmitGrantRoleToApplications(
                relationships,
                relationshipKeys,
                selfGrantNodeId,
                servicePrincipalNodeIds,
                AzureInventoryGrantRoleInferenceQualifiers.GraphRoleManagementReadWriteDirectory);

            EmitElevationHops(
                relationships,
                relationshipKeys,
                selfGrantNodeId,
                subscriptionScopes);

            if (applicationReadWriteAllPrincipalNodeIds.Contains(assignment.PrincipalNodeId))
            {
                continue;
            }

            foreach (string targetNodeId in servicePrincipalNodeIds)
            {
                AddCredentialEdge(
                    relationships,
                    relationshipKeys,
                    selfGrantNodeId,
                    targetNodeId,
                    "graph-application-readwrite-all");
            }
        }
    }

    private static HashSet<string> BuildApplicationReadWriteAllPrincipalNodeIds(
        IReadOnlyList<AzureInventoryGraphAppRoleAssignmentRow> graphAppRoleAssignments)
    {
        HashSet<string> principalNodeIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryGraphAppRoleAssignmentRow assignment in graphAppRoleAssignments)
        {
            if (!assignment.AppRoleId.Equals(
                    AzureInventoryMicrosoftGraphWellKnown.ApplicationReadWriteAllAppRoleId,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            principalNodeIds.Add(assignment.PrincipalNodeId);
        }

        return principalNodeIds;
    }

    private static List<string> BuildDistinctServicePrincipalNodeIds(
        IReadOnlyList<AzureInventoryEntraApplicationRegistrationRow> applicationRegistrations)
    {
        HashSet<string> nodeIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryEntraApplicationRegistrationRow registration in applicationRegistrations)
        {
            if (string.IsNullOrWhiteSpace(registration.ServicePrincipalObjectId))
            {
                continue;
            }

            nodeIds.Add(AzureInventoryPrincipalNodeId.Format(registration.ServicePrincipalObjectId.Trim()));
        }

        return nodeIds.OrderBy(static nodeId => nodeId, StringComparer.OrdinalIgnoreCase).ToList();
    }

    private static List<string> BuildDistinctSubscriptionScopes(IReadOnlyList<AzureExtractorExtendedResourceRow> resources)
    {
        HashSet<string> scopes = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureExtractorExtendedResourceRow resource in resources)
        {
            if (!TryGetSubscriptionScope(resource.AzureResourceId, out string subscriptionScope))
            {
                continue;
            }

            scopes.Add(subscriptionScope);
        }

        return scopes.OrderBy(static scope => scope, StringComparer.OrdinalIgnoreCase).ToList();
    }

    private static bool TryGetSubscriptionScope(string? azureResourceId, out string subscriptionScope)
    {
        subscriptionScope = string.Empty;

        if (string.IsNullOrWhiteSpace(azureResourceId))
        {
            return false;
        }

        string normalized = ArmResourceIdNormalizer.Normalize(azureResourceId);
        string[] segments = normalized.Split('/', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (segments.Length < 2
            || !segments[0].Equals("subscriptions", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        subscriptionScope = $"/subscriptions/{segments[1]}";

        return true;
    }

    private static void EmitGrantRoleToApplications(
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        string fromNodeId,
        IReadOnlyList<string> servicePrincipalNodeIds,
        string qualifier)
    {
        foreach (string targetNodeId in servicePrincipalNodeIds)
        {
            AddGrantRoleEdge(
                relationships,
                relationshipKeys,
                fromNodeId,
                targetNodeId,
                qualifier);
        }
    }

    private static void EmitElevationHops(
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        string fromNodeId,
        IReadOnlyList<string> subscriptionScopes)
    {
        foreach (string subscriptionScope in subscriptionScopes)
        {
            AddGrantRoleEdge(
                relationships,
                relationshipKeys,
                fromNodeId,
                ArmResourceIdNormalizer.Normalize(subscriptionScope),
                AzureInventoryGrantRoleInferenceQualifiers.GlobalAdminElevation);
        }
    }

    private static string? ResolveRoleTemplateId(AzureInventoryDirectoryRoleAssignmentRow assignment)
    {
        if (!string.IsNullOrWhiteSpace(assignment.RoleDefinitionTemplateId))
        {
            return assignment.RoleDefinitionTemplateId.Trim();
        }

        return assignment.RoleDefinitionId.Trim();
    }

    private static bool IsPimEligibilityUnknown(string? pimEligibilityKind)
    {
        if (string.IsNullOrWhiteSpace(pimEligibilityKind))
        {
            return false;
        }

        return pimEligibilityKind.Equals("eligible", StringComparison.OrdinalIgnoreCase)
            || pimEligibilityKind.Equals("unknown", StringComparison.OrdinalIgnoreCase);
    }

    private static void AddGrantRoleEdge(
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        string fromNodeId,
        string toNodeId,
        string qualifier)
    {
        AddRelationship(
            relationships,
            relationshipKeys,
            fromNodeId,
            toNodeId,
            GraphEdgeTypes.CanGrantRole,
            ProvenanceKind.DerivedFact,
            DerivedFactConfidence,
            GraphEdgeInferenceSources.WithQualifier(GraphEdgeInferenceSources.InventoryGrantRole, qualifier));
    }

    private static void AddCredentialEdge(
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        string fromNodeId,
        string toServicePrincipalNodeId,
        string qualifier)
    {
        AddRelationship(
            relationships,
            relationshipKeys,
            fromNodeId,
            toServicePrincipalNodeId,
            GraphEdgeTypes.CanAddCredential,
            ProvenanceKind.DerivedFact,
            DerivedFactConfidence,
            GraphEdgeInferenceSources.WithQualifier(GraphEdgeInferenceSources.InventoryAddCredential, qualifier));
    }

    private static void AddRelationship(
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        string fromNodeId,
        string toNodeId,
        string relationshipType,
        ProvenanceKind provenanceKind,
        decimal confidence,
        string inferenceSource)
    {
        string key = $"{fromNodeId}|{toNodeId}|{relationshipType}|{inferenceSource}";

        if (!relationshipKeys.Add(key))
        {
            return;
        }

        relationships.Add(new AzureInventoryResourceRelationshipWrite
        {
            FromAzureResourceId = fromNodeId,
            ToAzureResourceId = toNodeId,
            RelationshipType = relationshipType,
            ProvenanceKind = provenanceKind,
            Confidence = confidence,
            InferenceSource = inferenceSource,
        });
    }
}
