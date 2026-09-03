using System.Text.Json;
using System.Text.RegularExpressions;

namespace ArchLucid.Application.Integrations.Itsm;

/// <inheritdoc cref="IItsmInboundPayloadReader" />
public sealed class ItsmInboundJiraPayloadReader : IItsmInboundPayloadReader
{
    private const int MaxItsmExternalKeyLength = 256;

    private const int MaxJiraStatusNameLength = 128;

    private static readonly Regex JiraIssueKeyRegex = new(
        @"^[A-Za-z][A-Za-z0-9_]+-\d+$",
        RegexOptions.Compiled | RegexOptions.CultureInvariant);

    /// <inheritdoc />
    public bool TryRead(JsonElement root, out ItsmInboundPayloadReadResult result)
    {
        result = null!;

        string? issueKeyRaw = TryReadJiraIssueKey(root);

        if (string.IsNullOrWhiteSpace(issueKeyRaw))
            return false;

        string issueKey = issueKeyRaw.Trim();

        if (issueKey.Length > MaxItsmExternalKeyLength)
            throw new ItsmInboundPayloadValidationException(
                issueKey,
                "issue_key_too_long",
                "Jira issue key exceeds maximum stored length.");

        if (!JiraIssueKeyRegex.IsMatch(issueKey))
            throw new ItsmInboundPayloadValidationException(
                issueKey,
                "issue_key_invalid_format",
                "Jira issue key does not match expected PROJECT-NUMBER format.");

        string? statusNameRaw = TryReadJiraStatusName(root);

        if (string.IsNullOrWhiteSpace(statusNameRaw))
            return false;

        string statusName = statusNameRaw.Trim();

        if (statusName.Length > MaxJiraStatusNameLength)
            throw new ItsmInboundPayloadValidationException(
                issueKey,
                "status_name_too_long",
                "Jira status name exceeds maximum length.");

        result = new ItsmInboundPayloadReadResult
        {
            ExternalKey = issueKey,
            StatusValue = statusName,
        };

        return true;
    }

    private static string? TryReadJiraIssueKey(JsonElement root)
    {
        if (!TryGetPropertyCaseInsensitive(root, "issue", out JsonElement issue))
            return null;

        if (!TryGetPropertyCaseInsensitive(issue, "key", out JsonElement keyEl))
            return null;

        return keyEl.GetString();
    }

    private static string? TryReadJiraStatusName(JsonElement root)
    {
        if (!TryGetPropertyCaseInsensitive(root, "issue", out JsonElement issue))
            return null;

        if (!TryGetPropertyCaseInsensitive(issue, "fields", out JsonElement fields))
            return null;

        if (!TryGetPropertyCaseInsensitive(fields, "status", out JsonElement status))
            return null;

        if (!TryGetPropertyCaseInsensitive(status, "name", out JsonElement name))
            return null;

        return name.GetString();
    }

    private static bool TryGetPropertyCaseInsensitive(JsonElement element, string propertyName, out JsonElement value)
    {
        foreach (JsonProperty property in element.EnumerateObject())
        {
            if (!string.Equals(property.Name, propertyName, StringComparison.OrdinalIgnoreCase))
                continue;

            value = property.Value;

            return true;
        }

        value = default;

        return false;
    }
}
