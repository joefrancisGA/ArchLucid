namespace ArchLucid.Application.InfraEvidence.SecureNowArchitect;

internal static class SharedControlBlastRadiusNarrative
{
    public static string BuildTitle(SharedControlBlastRadiusCandidate candidate)
    {
        string control = ShortNodeLabel(candidate.ControlNodeId);

        return $"Shared control blast radius: {control} affects {candidate.DependentCount} dependents";
    }

    public static string BuildDescription(SharedControlBlastRadiusCandidate candidate)
    {
        string controlKind = candidate.ControlKind switch
        {
            SharedControlBlastRadiusControlKind.SharedManagedIdentity => "shared managed identity",
            SharedControlBlastRadiusControlKind.BroadScopeRoleAssignment => "broad-scope role assignment",
            SharedControlBlastRadiusControlKind.BroadScopePolicyAssignment => "broad-scope policy assignment",
            SharedControlBlastRadiusControlKind.CentralKeyVault => "central key vault access",
            _ => "shared control",
        };

        return $"Centralization improves consistency and increases correlated failure. "
               + $"This {controlKind} cites {candidate.DependentCount} snapshot dependents via observed assignments.";
    }

    private static string ShortNodeLabel(string nodeId)
    {
        int lastSlash = nodeId.LastIndexOf('/');

        return lastSlash >= 0 ? nodeId[(lastSlash + 1)..] : nodeId;
    }
}
