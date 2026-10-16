namespace ArchLucid.Core.InfraEvidence;

/// <summary>Well-known Microsoft Graph first-party application identifiers for privilege-path collection.</summary>
public static class AzureInventoryMicrosoftGraphWellKnown
{
    public const string ServicePrincipalAppId = "00000003-0000-0000-c000-000000000000";

    /// <summary>Application.ReadWrite.All app role id on Microsoft Graph (book Ch. 4 §4.4).</summary>
    public const string ApplicationReadWriteAllAppRoleId = "1bfefb4e-e0b5-418b-a88f-73c46d2cc8e9";

    /// <summary>RoleManagement.ReadWrite.Directory app role id on Microsoft Graph (book Ch. 4 §4.4).</summary>
    public const string RoleManagementReadWriteDirectoryAppRoleId = "9e3f62cf-ca93-4989-b6ce-bf83c28f9fe8";

    /// <summary>AppRoleAssignment.ReadWrite.All app role id on Microsoft Graph (book Ch. 4 §4.4).</summary>
    public const string AppRoleAssignmentReadWriteAllAppRoleId = "06b708a9-e830-4db3-a914-8e69da51d44f";

    public static bool IsCollectedPrivilegePathGraphAppRoleId(string? appRoleId)
    {
        if (string.IsNullOrWhiteSpace(appRoleId))
        {
            return false;
        }

        string normalized = appRoleId.Trim();

        return normalized.Equals(ApplicationReadWriteAllAppRoleId, StringComparison.OrdinalIgnoreCase)
            || normalized.Equals(RoleManagementReadWriteDirectoryAppRoleId, StringComparison.OrdinalIgnoreCase)
            || normalized.Equals(AppRoleAssignmentReadWriteAllAppRoleId, StringComparison.OrdinalIgnoreCase);
    }
}
