namespace ArchLucid.Application.Integrations.AzureBoards;

/// <summary>Upsert validation for <c>dbo.TenantAzureBoardsOutboundSettings</c>.</summary>
public static class AzureBoardsOutboundSettingsUpsertValidation
{
    public const string ProjectNameRequiredMessage = "ProjectName is required.";

    public const string DefaultWorkItemTypeRequiredMessage = "DefaultWorkItemType is required.";

    public static bool TryValidateProjectName(string? projectName, out string? trimmed, out string? errorMessage)
    {
        trimmed = null;
        errorMessage = null;

        if (string.IsNullOrWhiteSpace(projectName))
        {
            errorMessage = ProjectNameRequiredMessage;

            return false;
        }

        trimmed = projectName.Trim();

        return true;
    }

    public static bool TryValidateDefaultWorkItemType(string? workItemType, out string? trimmed, out string? errorMessage)
    {
        trimmed = null;
        errorMessage = null;

        if (string.IsNullOrWhiteSpace(workItemType))
        {
            errorMessage = DefaultWorkItemTypeRequiredMessage;

            return false;
        }

        trimmed = workItemType.Trim();

        return true;
    }

    public static bool TryValidateOptionalPath(string? path, out string? trimmed, out string? errorMessage)
    {
        trimmed = null;
        errorMessage = null;

        if (string.IsNullOrWhiteSpace(path))
            return true;

        trimmed = path.Trim();

        return true;
    }

    public static bool TryValidateOptionalTags(string? tags, out string? trimmed, out string? errorMessage)
    {
        trimmed = null;
        errorMessage = null;

        if (string.IsNullOrWhiteSpace(tags))
            return true;

        trimmed = tags.Trim();

        return true;
    }
}
