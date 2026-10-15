namespace ArchLucid.Core.AzureExtractor;

/// <summary>ARM types for Azure Monitor private link scopes (NR-38).</summary>
public static class AzureInventoryMonitorPrivateLinkScopeResourceTypes
{
    public const string ScopeArmType = "Microsoft.Insights/privateLinkScopes";

    public const string ScopedResourcesPathSegment = "/scopedResources/";

    public static bool IsScopeResourceType(string? armResourceType) =>
        string.Equals(armResourceType, ScopeArmType, StringComparison.OrdinalIgnoreCase);

    public static bool IsDiagramOmitChildType(string? armResourceType)
    {
        if (string.IsNullOrWhiteSpace(armResourceType))
        {
            return false;
        }

        if (IsScopeResourceType(armResourceType))
        {
            return false;
        }

        return armResourceType.Contains("privateLinkScopes/", StringComparison.OrdinalIgnoreCase);
    }

    public static bool TryParseScopeIdFromScopedResourceId(string? scopedResourceId, out string? scopeId)
    {
        scopeId = null;

        if (string.IsNullOrWhiteSpace(scopedResourceId))
        {
            return false;
        }

        string normalized = scopedResourceId.Trim();
        int segmentIndex = normalized.IndexOf(ScopedResourcesPathSegment, StringComparison.OrdinalIgnoreCase);

        if (segmentIndex <= 0)
        {
            return false;
        }

        scopeId = normalized[..segmentIndex];

        return true;
    }
}
