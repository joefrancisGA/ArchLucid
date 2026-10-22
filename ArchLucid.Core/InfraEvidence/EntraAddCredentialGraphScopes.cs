namespace ArchLucid.Core.InfraEvidence;

/// <summary>Documented Graph scopes for add-credential companion collection.</summary>
public static class EntraAddCredentialGraphScopes
{
    public const string PreferredScope =
        "Application.Read.All Directory.Read.All AppRoleAssignment.Read.All";

    public const string GraphDefaultScope = "https://graph.microsoft.com/.default";
}
