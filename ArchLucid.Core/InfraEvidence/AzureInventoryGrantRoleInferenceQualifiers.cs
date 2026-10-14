namespace ArchLucid.Core.InfraEvidence;

/// <summary>Qualifiers on <see cref="ArchLucid.KnowledgeGraph.GraphEdgeInferenceSources.InventoryGrantRole"/> edges.</summary>
public static class AzureInventoryGrantRoleInferenceQualifiers
{
    public const string GraphRoleManagementReadWriteDirectory = "graph-role-management-readwrite-directory";

    public const string GraphAppRoleAssignmentReadWriteAll = "graph-app-role-assignment-readwrite-all";

    public const string GlobalAdminElevation = "global-admin-elevation";
}
