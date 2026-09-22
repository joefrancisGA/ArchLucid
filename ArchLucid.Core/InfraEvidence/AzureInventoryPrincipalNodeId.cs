namespace ArchLucid.Core.InfraEvidence;

/// <summary>Stable node id prefix for Entra principals referenced by inventory RBAC rows (SA-02).</summary>
public static class AzureInventoryPrincipalNodeId
{
    public const string Prefix = "azure-ad://principal/";

    public static string Format(string principalId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(principalId);

        return Prefix + principalId.Trim();
    }
}
