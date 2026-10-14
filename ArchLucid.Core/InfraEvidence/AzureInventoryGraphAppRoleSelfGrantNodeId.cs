namespace ArchLucid.Core.InfraEvidence;

/// <summary>
///     Synthetic node for AppRoleAssignment.ReadWrite.All self-grant hops (book Ch. 4 §4.4).
/// </summary>
public static class AzureInventoryGraphAppRoleSelfGrantNodeId
{
    public const string Prefix = "azure-ad://graph-app-role-self-grant/";

    public static string Format(string principalId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(principalId);

        return Prefix + principalId.Trim().ToLowerInvariant();
    }
}
