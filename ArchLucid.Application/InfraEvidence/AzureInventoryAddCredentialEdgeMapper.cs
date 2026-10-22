using ArchLucid.Core.AzureExtractor;
using ArchLucid.Core.InfraEvidence;
using ArchLucid.KnowledgeGraph;
using ArchLucid.Persistence.InfraEvidence;

namespace ArchLucid.Application.InfraEvidence;

/// <summary>
///     Emits CAN_ADD_CREDENTIAL hops from owners, directory roles, and Application.ReadWrite.All (book Ch. 4–5).
/// </summary>
public static class AzureInventoryAddCredentialEdgeMapper
{
    private const decimal DerivedFactConfidence = 0.9m;

    public static void MapAddCredential(
        IReadOnlyList<AzureInventoryApplicationOwnerRow> applicationOwners,
        IReadOnlyList<AzureInventoryDirectoryRoleAssignmentRow> directoryRoleAssignments,
        IReadOnlyList<AzureInventoryEntraApplicationRegistrationRow> applicationRegistrations,
        IReadOnlyList<AzureInventoryGraphAppRoleAssignmentRow> graphAppRoleAssignments,
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys)
    {
        ArgumentNullException.ThrowIfNull(applicationOwners);
        ArgumentNullException.ThrowIfNull(directoryRoleAssignments);
        ArgumentNullException.ThrowIfNull(applicationRegistrations);
        ArgumentNullException.ThrowIfNull(graphAppRoleAssignments);
        ArgumentNullException.ThrowIfNull(relationships);
        ArgumentNullException.ThrowIfNull(relationshipKeys);

        Dictionary<string, string> appIdToServicePrincipalObjectId = BuildAppIdToServicePrincipalMap(applicationRegistrations);
        List<string> servicePrincipalNodeIds = BuildDistinctServicePrincipalNodeIds(applicationRegistrations);
        HashSet<string> appRoleAssignmentReadWriteAllPrincipalNodeIds =
            BuildAppRoleAssignmentReadWriteAllPrincipalNodeIds(graphAppRoleAssignments);

        foreach (AzureInventoryApplicationOwnerRow owner in applicationOwners)
        {
            if (!appIdToServicePrincipalObjectId.TryGetValue(owner.AppId, out string? servicePrincipalObjectId))
            {
                continue;
            }

            AddCredentialEdge(
                relationships,
                relationshipKeys,
                owner.OwnerNodeId,
                AzureInventoryPrincipalNodeId.Format(servicePrincipalObjectId),
                "owner");
        }

        foreach (AzureInventoryDirectoryRoleAssignmentRow assignment in directoryRoleAssignments)
        {
            if (IsPimEligibilityUnknown(assignment.PimEligibilityKind))
            {
                continue;
            }

            string? templateId = ResolveRoleTemplateId(assignment);

            if (!AzureInventoryAddCredentialDirectoryRoleTemplates.IsTenantWideCanAddCredentialRole(templateId))
            {
                continue;
            }

            if (!AzureInventoryAddCredentialDirectoryRoleTemplates.IsTenantWideDirectoryScope(assignment.DirectoryScopeId))
            {
                continue;
            }

            foreach (string targetNodeId in servicePrincipalNodeIds)
            {
                AddCredentialEdge(
                    relationships,
                    relationshipKeys,
                    assignment.PrincipalNodeId,
                    targetNodeId,
                    "directory-role");
            }
        }

        foreach (AzureInventoryGraphAppRoleAssignmentRow assignment in graphAppRoleAssignments)
        {
            if (!IsApplicationReadWriteAllOnMicrosoftGraph(assignment))
            {
                continue;
            }

            if (appRoleAssignmentReadWriteAllPrincipalNodeIds.Contains(assignment.PrincipalNodeId))
            {
                continue;
            }

            foreach (string targetNodeId in servicePrincipalNodeIds)
            {
                AddCredentialEdge(
                    relationships,
                    relationshipKeys,
                    assignment.PrincipalNodeId,
                    targetNodeId,
                    "graph-application-readwrite-all");
            }
        }
    }

    private static Dictionary<string, string> BuildAppIdToServicePrincipalMap(
        IReadOnlyList<AzureInventoryEntraApplicationRegistrationRow> applicationRegistrations)
    {
        Dictionary<string, string> map = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryEntraApplicationRegistrationRow registration in applicationRegistrations)
        {
            if (string.IsNullOrWhiteSpace(registration.AppId)
                || string.IsNullOrWhiteSpace(registration.ServicePrincipalObjectId))
            {
                continue;
            }

            map[registration.AppId.Trim()] = registration.ServicePrincipalObjectId.Trim();
        }

        return map;
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

    private static string? ResolveRoleTemplateId(AzureInventoryDirectoryRoleAssignmentRow assignment)
    {
        if (!string.IsNullOrWhiteSpace(assignment.RoleDefinitionTemplateId))
        {
            return assignment.RoleDefinitionTemplateId.Trim();
        }

        return assignment.RoleDefinitionId.Trim();
    }

    private static HashSet<string> BuildAppRoleAssignmentReadWriteAllPrincipalNodeIds(
        IReadOnlyList<AzureInventoryGraphAppRoleAssignmentRow> graphAppRoleAssignments)
    {
        HashSet<string> principalNodeIds = new(StringComparer.OrdinalIgnoreCase);

        foreach (AzureInventoryGraphAppRoleAssignmentRow assignment in graphAppRoleAssignments)
        {
            if (!assignment.AppRoleId.Equals(
                    AzureInventoryMicrosoftGraphWellKnown.AppRoleAssignmentReadWriteAllAppRoleId,
                    StringComparison.OrdinalIgnoreCase))
            {
                continue;
            }

            principalNodeIds.Add(assignment.PrincipalNodeId);
        }

        return principalNodeIds;
    }

    private static bool IsApplicationReadWriteAllOnMicrosoftGraph(AzureInventoryGraphAppRoleAssignmentRow assignment)
    {
        return assignment.AppRoleId.Equals(
            AzureInventoryMicrosoftGraphWellKnown.ApplicationReadWriteAllAppRoleId,
            StringComparison.OrdinalIgnoreCase);
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

    private static void AddCredentialEdge(
        List<AzureInventoryResourceRelationshipWrite> relationships,
        HashSet<string> relationshipKeys,
        string fromPrincipalNodeId,
        string toServicePrincipalNodeId,
        string qualifier)
    {
        AddRelationship(
            relationships,
            relationshipKeys,
            fromPrincipalNodeId,
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
