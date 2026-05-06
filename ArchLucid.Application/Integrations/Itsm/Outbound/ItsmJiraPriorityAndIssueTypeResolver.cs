using ArchLucid.Contracts.Findings;
using ArchLucid.Persistence.Integrations;

namespace ArchLucid.Application.Integrations.Itsm.Outbound;

internal static class ItsmJiraPriorityAndIssueTypeResolver
{
    internal const string DefaultIssueTypeName = "Task";

    /// <summary>Returns <see langword="null"/> when the finding must not create a Jira issue (informational drop).</summary>
    public static string? TryJiraPriorityName(FindingSeverity severity, bool jiraSendInfoSeverity)
    {
        return severity switch
        {
            FindingSeverity.Critical => "Blocker",
            FindingSeverity.Error => "High",
            FindingSeverity.Warning => "Medium",
            FindingSeverity.Info => jiraSendInfoSeverity ? "Low" : null,
            _ => null
        };
    }

    public static string ResolveIssueTypeName(FindingSeverity severity, TenantItsmOutboundSettings? tenantRow)
    {
        if (tenantRow?.JiraIssueTypeBySeverityJson is null || tenantRow.JiraIssueTypeBySeverityJson.Length is 0)
            return DefaultIssueTypeName;

        try
        {
            Dictionary<string, string>? map =
                System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(tenantRow.JiraIssueTypeBySeverityJson);

            if (map is null || map.Count is 0)
                return DefaultIssueTypeName;

            string key = severity.ToString();

            foreach (KeyValuePair<string, string> kv in map)
            {
                if (string.IsNullOrWhiteSpace(kv.Value))
                    continue;

                if (string.Equals(kv.Key.Trim(), key, StringComparison.OrdinalIgnoreCase))
                    return kv.Value.Trim();
            }
        }
        catch (System.Text.Json.JsonException)
        {
            return DefaultIssueTypeName;
        }

        return DefaultIssueTypeName;
    }
}
