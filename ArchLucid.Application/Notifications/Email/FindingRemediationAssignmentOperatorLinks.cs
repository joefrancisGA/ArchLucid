namespace ArchLucid.Application.Notifications.Email;

/// <summary>Operator-shell deep links for finding remediation assignment email (TB-2195).</summary>
public static class FindingRemediationAssignmentOperatorLinks
{
    public static string BuildFindingInspectUrl(string? operatorBaseUrl, Guid runId, string findingId)
    {
        string runHex = runId.ToString("N");
        string encodedFindingId = Uri.EscapeDataString(findingId.Trim());
        string relativePath = $"/architecture/reviews/{runHex}/findings/{encodedFindingId}";

        string? authority = EmailBrandingUrls.TryNormalizeOperatorBaseAuthority(operatorBaseUrl);

        if (authority is null)
            return relativePath;

        return $"{authority}{relativePath}";
    }

    public static string BuildAssignedToMeQueueUrl(string? operatorBaseUrl)
    {
        const string relativePath = "/governance/findings/assigned-to-me";

        string? authority = EmailBrandingUrls.TryNormalizeOperatorBaseAuthority(operatorBaseUrl);

        if (authority is null)
            return relativePath;

        return $"{authority}{relativePath}";
    }
}
