namespace ArchLucid.Application.Integrations.Itsm.Outbound;

/// <summary>Maps TB-395 remediation assignment fields to vendor ticket create payloads.</summary>
public static class ItsmOutboundVendorRemediationFields
{
    public static string? FormatJiraDueDate(DateTimeOffset? remediationDueUtc) =>
        remediationDueUtc?.UtcDateTime.ToString("yyyy-MM-dd");

    public static string? FormatServiceNowDueDate(DateTimeOffset? remediationDueUtc) =>
        remediationDueUtc?.UtcDateTime.ToString("yyyy-MM-dd HH:mm:ss");

    public static bool LooksLikeJiraAccountId(string? assignedToUserId) =>
        !string.IsNullOrWhiteSpace(assignedToUserId) && assignedToUserId.Trim().Length is >= 24 and <= 128;
}
