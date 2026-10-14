namespace ArchLucid.Core.InfraEvidence;

/// <summary>
///     Built-in Entra directory role template ids that may add credentials to any application (book Ch. 5 Step 1).
/// </summary>
public static class AzureInventoryAddCredentialDirectoryRoleTemplates
{
    public const string ApplicationAdministrator = "9b895d92-2cd3-44c7-9d02-a6ac2d5ea5c3";

    public const string CloudApplicationAdministrator = "158c047a-c907-4556-b7ef-446551a6b5f7";

    public const string GlobalAdministrator = "62e90394-69f5-4237-9190-012177145e10";

    public static bool IsTenantWideCanAddCredentialRole(string? roleDefinitionTemplateId)
    {
        if (string.IsNullOrWhiteSpace(roleDefinitionTemplateId))
        {
            return false;
        }

        string normalized = roleDefinitionTemplateId.Trim();

        return normalized.Equals(ApplicationAdministrator, StringComparison.OrdinalIgnoreCase)
            || normalized.Equals(CloudApplicationAdministrator, StringComparison.OrdinalIgnoreCase)
            || normalized.Equals(GlobalAdministrator, StringComparison.OrdinalIgnoreCase);
    }

    public static bool IsTenantWideDirectoryScope(string? directoryScopeId)
    {
        if (string.IsNullOrWhiteSpace(directoryScopeId))
        {
            return false;
        }

        return directoryScopeId.Trim() == "/";
    }
}
