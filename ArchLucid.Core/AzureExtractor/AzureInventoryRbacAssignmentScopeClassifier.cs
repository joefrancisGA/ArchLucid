namespace ArchLucid.Core.AzureExtractor;

/// <summary>
///     Classifies RBAC assignment scopes for app-authorized-access materialization (AX-DE-03).
/// </summary>
public static class AzureInventoryRbacAssignmentScopeClassifier
{
    public static bool IsBroadScope(string normalizedScope)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(normalizedScope);

        if (!normalizedScope.StartsWith("/subscriptions/", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        int providersIndex = normalizedScope.IndexOf("/providers/", StringComparison.OrdinalIgnoreCase);

        if (providersIndex >= 0)
        {
            return false;
        }

        return true;
    }

    public static bool TryResolveAttestedScope(
        string normalizedScope,
        IReadOnlySet<string> inventoriedArmIds,
        out string attestedScope)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(normalizedScope);
        ArgumentNullException.ThrowIfNull(inventoriedArmIds);

        if (inventoriedArmIds.Contains(normalizedScope))
        {
            attestedScope = normalizedScope;

            return true;
        }

        string scopePrefix = normalizedScope.EndsWith('/')
            ? normalizedScope
            : normalizedScope + "/";

        foreach (string inventoriedArmId in inventoriedArmIds)
        {
            if (inventoriedArmId.StartsWith(scopePrefix, StringComparison.OrdinalIgnoreCase))
            {
                attestedScope = normalizedScope;

                return true;
            }
        }

        attestedScope = string.Empty;

        return false;
    }
}
