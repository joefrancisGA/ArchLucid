using System.Text.Json;

namespace ArchLucid.Application.Integrations.Itsm;

/// <summary>Validation for <see cref="ArchLucid.Contracts.Integrations.TenantItsmOutboundSettingsUpsertRequest" />.</summary>
public static class TenantItsmOutboundSettingsUpsertValidation
{
    public const int JiraProjectKeyMaxLength = 32;

    public const int JiraIssueTypeJsonMaxLength = 4000;

    public static bool TryValidateJiraProjectKeyOverride(
        string? value,
        out string? trimmed,
        out string? errorMessage)
    {
        trimmed = null;
        errorMessage = null;

        if (string.IsNullOrWhiteSpace(value))
        {
            trimmed = null;

            return true;
        }

        trimmed = value.Trim();

        if (trimmed.Length > JiraProjectKeyMaxLength)
        {
            errorMessage = $"JiraProjectKeyOverride must be at most {JiraProjectKeyMaxLength} characters.";

            return false;
        }

        foreach (char c in trimmed)
        {
            if (!char.IsLetterOrDigit(c) && c != '-')
            {
                errorMessage = "JiraProjectKeyOverride may contain letters, digits, and hyphens only.";

                return false;
            }
        }

        return true;
    }

    public static bool TryValidateJiraIssueTypeBySeverityJson(
        string? value,
        out string? trimmed,
        out string? errorMessage)
    {
        trimmed = null;
        errorMessage = null;

        if (string.IsNullOrWhiteSpace(value))
        {
            trimmed = null;

            return true;
        }

        trimmed = value.Trim();

        if (trimmed.Length > JiraIssueTypeJsonMaxLength)
        {
            errorMessage = $"JiraIssueTypeBySeverityJson must be at most {JiraIssueTypeJsonMaxLength} characters.";

            return false;
        }

        try
        {
            using JsonDocument document = JsonDocument.Parse(trimmed);

            if (document.RootElement.ValueKind != JsonValueKind.Object)
            {
                errorMessage = "JiraIssueTypeBySeverityJson must be a JSON object (severity name → issue type name).";

                return false;
            }
        }
        catch (JsonException)
        {
            errorMessage = "JiraIssueTypeBySeverityJson must be valid JSON.";

            return false;
        }

        return true;
    }
}
