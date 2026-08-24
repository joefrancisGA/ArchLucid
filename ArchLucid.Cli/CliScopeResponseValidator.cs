using ArchLucid.Contracts.Drafts;

namespace ArchLucid.Cli;

/// <summary>
///     Validates API resource scope against configured CLI scope headers (config + environment).
/// </summary>
internal static class CliScopeResponseValidator
{
    internal static bool TryValidateDraftScope(
        DraftRequestResponse draft,
        ArchLucidProjectScaffolder.ArchLucidCliConfig? config,
        out string? errorMessage)
    {
        ArgumentNullException.ThrowIfNull(draft);

        string? configuredTenantId = CliScopeHeaders.ResolveTenantId(config);
        string? configuredWorkspaceId = CliScopeHeaders.ResolveWorkspaceId(config);
        string? configuredProjectId = CliScopeHeaders.ResolveProjectId(config);

        if (string.IsNullOrWhiteSpace(configuredTenantId)
            && string.IsNullOrWhiteSpace(configuredWorkspaceId)
            && string.IsNullOrWhiteSpace(configuredProjectId))
        {
            errorMessage = null;

            return true;
        }

        if (!TryValidateGuidScope(
                configuredTenantId,
                draft.TenantId,
                "tenantId",
                out errorMessage))
            return false;

        if (!TryValidateGuidScope(
                configuredWorkspaceId,
                draft.WorkspaceId,
                "workspaceId",
                out errorMessage))
            return false;

        if (!TryValidateGuidScope(
                configuredProjectId,
                draft.ProjectId,
                "projectId",
                out errorMessage))
            return false;

        errorMessage = null;

        return true;
    }

    private static bool TryValidateGuidScope(
        string? configuredValue,
        Guid actualValue,
        string fieldName,
        out string? errorMessage)
    {
        if (string.IsNullOrWhiteSpace(configuredValue))
        {
            errorMessage = null;

            return true;
        }

        string trimmed = configuredValue.Trim();

        if (!Guid.TryParse(trimmed, out Guid expectedValue))
        {
            errorMessage =
                $"Configured CLI scope {fieldName} '{trimmed}' is not a valid GUID. Fix archlucid.json scope or environment variables.";

            return false;
        }

        if (expectedValue != actualValue)
        {
            errorMessage =
                $"Draft {fieldName} {actualValue:D} does not match configured CLI scope {expectedValue:D}. "
                + "The draft was created under a different scope than archlucid.json / scope headers.";

            return false;
        }

        errorMessage = null;

        return true;
    }
}
