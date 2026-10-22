namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Property keys and diagram collapse marker for a Databricks access connector.
///     The connector is an identity path from a workspace to storage, not a peer workload.
/// </summary>
public static class AzureInventoryDatabricksAccessConnector
{
    public const string IdPropertyKey = "accessConnector.id";

    public const string IdentityTypePropertyKey = "accessConnector.identityType";

    public const string UserAssignedIdentityIdPropertyKey = "accessConnector.userAssignedIdentityId";

    public const string IdentityPropertyKey = "identity";

    public const string CollapseNodePropertyKey = "diagram.collapseAccessConnector";

    public const string EdgeType = "ACCESS_CONNECTOR";

    /// <summary>Built-in Storage Blob Data Owner. Kept here so the global RBAC map is unchanged.</summary>
    public const string StorageBlobDataOwnerRoleDefinitionId = "b7e6dc6d-f1e8-4753-8033-0f276bb0955b";

    public static bool IsAccessConnectorType(string? resourceType)
    {
        return (resourceType ?? string.Empty)
            .Contains("Microsoft.Databricks/accessConnectors", StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsWorkspaceType(string? resourceType)
    {
        return (resourceType ?? string.Empty)
            .Contains("Microsoft.Databricks/workspaces", StringComparison.OrdinalIgnoreCase);
    }
}
